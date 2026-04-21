import { useState } from 'react';

interface ExerciseRecommendation {
  name: string;
  duration: number;
  caloriesBurned: number;
}

interface ExerciseModalProps {
  onClose: () => void;
  recommendations: ExerciseRecommendation[];
  goal: string;
  message: string;
  caloriesNeeded: number;
}

export default function ExerciseModal({ 
  onClose, 
  recommendations, 
  goal, 
  message,
  caloriesNeeded 
}: ExerciseModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">🏃 Exercise Recommendations</h2>
          <button className="modal-close" onClick={onClose} style={{ background: '#800000', color: 'white', border: 'none', cursor: 'pointer', fontSize: '24px', padding: '4px 8px', borderRadius: '8px' }}>×</button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '1.5rem' }}>
          {/* Calories Needed */}
          <div style={{ 
            background: caloriesNeeded > 0 ? '#fff3cd' : '#d4edda',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '16px',
            border: `1px solid ${caloriesNeeded > 0 ? '#ffc107' : '#28a745'}`
          }}>
            <div style={{ 
              fontSize: '13px', 
              color: caloriesNeeded > 0 ? '#856404' : '#155724',
              marginBottom: '8px',
              fontWeight: 600
            }}>
              {caloriesNeeded > 0 ? '🔥 Calories to Burn' : '✅ Under Target'}
            </div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 700, 
              color: caloriesNeeded > 0 ? '#856404' : '#155724'
            }}>
              {Math.abs(caloriesNeeded)} kcal
            </div>
          </div>

          {/* Message */}
          <div style={{ 
            padding: '12px',
            background: message.includes('✅') ? '#d4edda' : '#fff3cd',
            color: message.includes('✅') ? '#155724' : '#856404',
            borderRadius: '8px',
            marginBottom: '20px',
            borderLeft: `4px solid ${message.includes('✅') ? '#28a745' : '#ffc107'}`,
            fontSize: '14px',
            fontWeight: 600
          }}>
            {message}
          </div>

          {/* Exercise Options */}
          {recommendations && recommendations.length > 0 ? (
            <div>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 700, 
                marginBottom: '12px',
                color: '#2c3e50'
              }}>
                Choose Your Exercise:
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {recommendations.map((rec, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: '#f8f9fa',
                      border: '2px solid #e9ecef',
                      padding: '16px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e9ecef';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: '#2c3e50', marginBottom: '4px' }}>
                          {rec.name}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6c757d' }}>
                          ⏱️ {rec.duration} minutes
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '18px', color: '#667eea' }}>
                        {rec.caloriesBurned} kcal
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: '#6c757d',
              fontSize: '14px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>You're on track!</div>
              <div>No additional exercises needed right now.</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '12px',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e9ecef'
        }}>
          <button className="btn-secondary" onClick={onClose} style={{ background: '#800000', color: 'white', borderColor: '#660000' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
