import { google } from "googleapis";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT;

function createOAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

async function getAuthorizedClientForUser(user) {
  if (!user.google?.tokens?.refresh_token) {
    throw new Error("User has no Google Fit tokens");
  }

  const client = createOAuthClient();
  client.setCredentials(user.google.tokens);

  // Check if token is expired or about to expire (5 min buffer)
  const now = Date.now();
  const expiryDate = user.google.tokens.expiry_date || 0;
  
  if (expiryDate - now < 5 * 60 * 1000) {
    console.log('🔄 Token expired or expiring soon, refreshing...');
    try {
      const { credentials } = await client.refreshAccessToken();
      
      user.google.tokens.access_token = credentials.access_token;
      user.google.tokens.expiry_date = credentials.expiry_date;
      
      if (credentials.refresh_token) {
        user.google.tokens.refresh_token = credentials.refresh_token;
      }
      
      await user.save();
      console.log('✅ Token refreshed successfully');
      
      // Update client with new credentials
      client.setCredentials(user.google.tokens);
    } catch (err) {
      console.error('❌ Token refresh failed:', err.message);
      throw new Error('Failed to refresh Google tokens. Please re-authenticate.');
    }
  }

  client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      user.google.tokens.access_token = tokens.access_token;
    }
    if (tokens.expiry_date) {
      user.google.tokens.expiry_date = tokens.expiry_date;
    }
    if (tokens.refresh_token) {
      user.google.tokens.refresh_token = tokens.refresh_token;
    }
    await user.save();
  });

  return client;
}

// Try reading data directly from the datastore
async function fetchDirectSteps(user, startMs, endMs) {
  let retries = 2;
  let lastError;
  
  while (retries > 0) {
    try {
      const authClient = await getAuthorizedClientForUser(user);
      const fitness = google.fitness({ version: "v1", auth: authClient });

      console.log(`\n🔬 Fetching Google Fit Data (Attempt ${3 - retries})`);
      console.log(`📅 Time Range: ${new Date(startMs).toISOString()} to ${new Date(endMs).toISOString()}`);
      console.log(`📅 Local Time: ${new Date(startMs).toLocaleString()} to ${new Date(endMs).toLocaleString()}`);

      // Try AGGREGATE API first (more reliable for step counts)
      console.log('\n🔄 Using Aggregate API for step count...');
      
      const aggregateRequest = {
        aggregateBy: [{
          dataTypeName: 'com.google.step_count.delta',
          dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
        }],
        bucketByTime: { durationMillis: endMs - startMs }, // Single bucket for the whole period
        startTimeMillis: startMs,
        endTimeMillis: endMs
      };

      console.log('📡 Sending aggregate request...');
      const aggregateResponse = await fitness.users.dataset.aggregate({
        userId: 'me',
        requestBody: aggregateRequest
      });

      console.log(`📊 Buckets received: ${aggregateResponse.data.bucket?.length || 0}`);

      let totalSteps = 0;
      
      if (aggregateResponse.data.bucket && aggregateResponse.data.bucket.length > 0) {
        aggregateResponse.data.bucket.forEach(bucket => {
          console.log(`\n🪣 Bucket time: ${new Date(parseInt(bucket.startTimeMillis)).toISOString()} to ${new Date(parseInt(bucket.endTimeMillis)).toISOString()}`);
          
          if (bucket.dataset && bucket.dataset.length > 0) {
            bucket.dataset.forEach(dataset => {
              console.log(`  📦 Dataset has ${dataset.point?.length || 0} points`);
              
              if (dataset.point) {
                dataset.point.forEach(point => {
                  const steps = point.value?.[0]?.intVal || 0;
                  totalSteps += steps;
                  console.log(`    ✅ +${steps} steps at ${new Date(parseInt(point.startTimeNanos) / 1000000).toISOString()}`);
                });
              }
            });
          } else {
            console.log('  ⚠️ No datasets in this bucket');
          }
        });
      } else {
        console.log('⚠️ No buckets returned from aggregate API');
      }

      console.log(`\n📊 AGGREGATE TOTAL: ${totalSteps} steps`);
      
      // If aggregate returns 0, try direct dataset API as fallback
      if (totalSteps === 0) {
        console.log('\n🔄 Aggregate returned 0, trying direct dataset API...');
        const dataSourceId = 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps';
        
        const dataset = await fitness.users.dataSources.datasets.get({
          userId: 'me',
          dataSourceId: dataSourceId,
          datasetId: `${startMs * 1000000}-${endMs * 1000000}` // Convert to nanoseconds
        });

        console.log(`📊 Direct dataset points: ${dataset.data.point?.length || 0}`);

        if (dataset.data.point) {
          dataset.data.point.forEach(point => {
            const steps = point.value?.[0]?.intVal || 0;
            totalSteps += steps;
            if (steps > 0) {
              console.log(`  ✅ Found ${steps} steps at ${new Date(parseInt(point.startTimeNanos) / 1000000).toISOString()}`);
            }
          });
        }
      }

      console.log(`\n📊 FINAL TOTAL STEPS: ${totalSteps}`);
      return { steps: totalSteps, raw: aggregateResponse.data };

    } catch (err) {
      lastError = err;
      console.error('❌ Direct API Error:', err.message);
      
      if (err.code === 'ECONNRESET' || err.message.includes('ECONNRESET')) {
        console.log(`🔄 Connection reset, retrying... (${retries - 1} retries left)`);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          continue;
        }
      }
      
      if (err.response?.data) {
        console.error('Response:', JSON.stringify(err.response.data, null, 2));
      }
      
      throw err;
    }
  }
  
  throw lastError || new Error('Failed to fetch steps after retries');
}

export { fetchDirectSteps };
