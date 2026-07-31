'use client';

import { useTheme, useWidgetSDK, useMaxHeight } from '@nitrostack/widgets';
import { useState } from 'react';

export const dynamic = 'force-dynamic';

interface FraudSignal {
  name: string;
  weight: number;
  triggered: boolean;
  detail: string;
}

interface WidgetData {
  orderId: string;
  claimValueINR: number;
  score: number;
  signals: FraudSignal[];
}

export default function SentryAmazonWidget() {
  const theme = useTheme();
  const maxHeight = useMaxHeight();
  const isDark = theme === 'dark';

  const { isReady, getToolOutput, callTool } = useWidgetSDK();
  const data = getToolOutput<WidgetData>();

  const [isApproving, setIsApproving] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'error'>('pending');

  console.log('SentryAmazonWidget render:', { isReady, hasData: !!data, data });

  if (!isReady) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: isDark ? '#fff' : '#000' }}>
        Initializing widget SDK...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: isDark ? '#999' : '#666' }}>
        Waiting for incident data...
      </div>
    );
  }

  if (!data.orderId || !data.signals || !Array.isArray(data.signals)) {
    console.error('bad widget data:', data);
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: isDark ? '#ff6b6b' : '#d32f2f' }}>
        error: bad incident data structure
        <pre style={{ marginTop: '16px', fontSize: '12px', textAlign: 'left', overflow: 'auto' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await callTool('dispatch_safet_claim_email', {
        orderId: data.orderId,
        claimValueINR: data.claimValueINR,
        fraudScore: data.score,
        recipientEmail: 'judge@example.com',
      });
      setApprovalStatus('approved');
    } catch (error) {
      console.error('Approval failed:', error);
      setApprovalStatus('error');
    } finally {
      setIsApproving(false);
    }
  };

  const triggeredSignals = data.signals.filter(s => s.triggered);

  return (
    <div
      style={{
        background: isDark ? '#0a0a0a' : '#f9fafb',
        minHeight: '400px',
        maxHeight: maxHeight || '800px',
        overflow: 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          background: isDark ? '#1a1a1a' : '#ffffff',
          borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
          padding: '20px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: isDark ? '#fff' : '#111' }}>
              Incident Review
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: isDark ? '#999' : '#666' }}>
              Order {data.orderId}
            </p>
          </div>

          <div
            style={{
              background: data.score >= 80 ? '#dc2626' : data.score >= 50 ? '#f59e0b' : '#10b981',
              color: '#fff',
              padding: '12px 16px',
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '80px',
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: '700' }}>{data.score}%</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Fraud Score</div>
          </div>
        </div>

        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            background: isDark ? '#111' : '#f3f4f6',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        >
          <span style={{ color: isDark ? '#999' : '#666' }}>Claim Value:</span>
          <span style={{ marginLeft: '8px', fontWeight: '600', color: isDark ? '#fff' : '#111' }}>
            ₹{data.claimValueINR.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: isDark ? '#fff' : '#111' }}>
          Signal Analysis
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(data.signals ?? []).map((signal, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px',
                background: isDark ? '#1a1a1a' : '#ffffff',
                border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                borderRadius: '6px',
                borderLeft: `4px solid ${signal.triggered ? '#dc2626' : '#10b981'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: isDark ? '#fff' : '#111',
                      marginBottom: '4px',
                    }}
                  >
                    {signal.name.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '13px', color: isDark ? '#999' : '#666', lineHeight: '1.4' }}>
                    {signal.detail}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: signal.triggered ? '#dc2626' : '#10b981',
                    }}
                  >
                    {signal.triggered ? 'Triggered' : 'Clear'}
                  </div>
                  <div style={{ fontSize: '11px', color: isDark ? '#666' : '#999' }}>
                    Weight: {(signal.weight * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            background: isDark ? '#111' : '#f3f4f6',
            borderRadius: '6px',
            fontSize: '13px',
            color: isDark ? '#999' : '#666',
          }}
        >
          <strong>{triggeredSignals.length}</strong> of <strong>{data.signals.length}</strong> signals triggered
        </div>
      </div>

      <div
        style={{
          padding: '20px',
          borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
          background: isDark ? '#1a1a1a' : '#ffffff',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}
      >
        {approvalStatus === 'pending' && (
          <>
            <button
              disabled={isApproving}
              style={{
                padding: '10px 16px',
                background: isDark ? '#333' : '#e5e7eb',
                border: 'none',
                borderRadius: '6px',
                color: isDark ? '#fff' : '#111',
                cursor: isApproving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: isApproving ? 0.5 : 1,
              }}
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={isApproving}
              style={{
                padding: '10px 16px',
                background: '#10b981',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: isApproving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: isApproving ? 0.5 : 1,
              }}
            >
              {isApproving ? 'Approving...' : 'Approve & Dispatch'}
            </button>
          </>
        )}

        {approvalStatus === 'approved' && (
          <div
            style={{
              padding: '10px 16px',
              background: '#10b981',
              color: '#fff',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Approved & Dispatched
          </div>
        )}

        {approvalStatus === 'error' && (
          <div
            style={{
              padding: '10px 16px',
              background: '#dc2626',
              color: '#fff',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Approval Failed
          </div>
        )}
      </div>

      <div
        style={{
          padding: '16px 20px',
          fontSize: '12px',
          color: isDark ? '#666' : '#999',
          borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
          textAlign: 'center',
        }}
      >
        Powered by SentryFlow
      </div>
    </div>
  );
}
