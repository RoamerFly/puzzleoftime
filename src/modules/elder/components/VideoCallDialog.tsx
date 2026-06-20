/* === 平板视频通话对话框（v6.6 新增，v6.7 增加拨号动画） ===
 *
 * 点击"平板"热点后，先展示视频拨号动画（ElderScene），再打开此对话框
 *
 * 流程:
 *   拨号动画(6s) → connecting(2s) → connected/视频画面+字幕逐行弹出+挂断按钮
 *   拨号动画(6s) → failed/黑屏+失败文本+确认按钮
 *
 * Props:
 *   - status: 当前通话状态
 *   - callGroupId: 对话组ID（随机抽取 videoCallMessages）
 *   - currentLineIndex: 当前显示的对话行索引
 *   - connectionQuality: 连接质量
 *   - lines: 当前通话的对话行数组
 *   - canHangup: 是否可挂断
 *   - failedText: 失败时的显示文本
 *   - onHangup: 挂断回调
 */

import { useState, useEffect, useRef } from 'react';
import { getRandomTabletImage } from '../data/generatedAssets';

export interface VideoCallLine {
  speaker: string;
  text: string;
}

interface VideoCallDialogProps {
  status: 'connecting' | 'connected' | 'failed' | 'ended';
  callGroupId: string;
  currentLineIndex: number;
  connectionQuality: 'good' | 'unstable' | 'failed';
  lines: VideoCallLine[];
  canHangup: boolean;
  failedText?: string;
  onHangup: () => void;
  /** 连接质量变化时触发（如 connecting→connected） */
  onQualityChange?: () => void;
}

export function VideoCallDialog({
  status,
  callGroupId: _callGroupId,
  currentLineIndex,
  connectionQuality,
  lines,
  canHangup,
  failedText,
  onHangup,
}: VideoCallDialogProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [connectingDots, setConnectingDots] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  // 接通时随机选一张平板通话图
  const [tabletImage] = useState(() => getRandomTabletImage());

  // 弹入动画
  useEffect(() => {
    const timer = setTimeout(() => setShowDialog(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 连接中的三点动画
  useEffect(() => {
    if (status !== 'connecting') return;
    const interval = setInterval(() => {
      setConnectingDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [status]);

  // 自动滚动到最新消息
  useEffect(() => {
    if (dialogRef.current) {
      const el = dialogRef.current.querySelector('.elder-video-call-captions');
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [currentLineIndex]);

  const qualityClass = connectionQuality === 'unstable'
    ? 'elder-video-call-screen--unstable'
    : connectionQuality === 'failed'
    ? 'elder-video-call-screen--failed'
    : '';

  return (
    <div className={`elder-video-call-overlay ${showDialog ? 'elder-video-call-overlay--visible' : ''}`}>
      <div
        className={`elder-video-call-card ${showDialog ? 'elder-video-call-card--visible' : ''}`}
        ref={dialogRef}
      >
        {/* ── 平板外框 + 屏幕区域 ── */}
        <div className={`elder-video-call-screen ${status === 'connecting' ? 'elder-video-call-screen--connecting' : ''} ${qualityClass}`}>
          {/* 连接中 */}
          {status === 'connecting' && (
            <div className="elder-video-call-connecting">
              <div className="elder-video-call-connecting-avatar">
                <span className="elder-video-call-connecting-icon">📱</span>
              </div>
              <div className="elder-video-call-connecting-text">
                正在连接视频{connectingDots}
              </div>
            </div>
          )}

          {/* 接通/不稳定 */}
          {(status === 'connected' || (status === 'connecting' && connectionQuality === 'unstable')) && (
            <div className="elder-video-call-video-area">
              {connectionQuality === 'unstable' && (
                <div className="elder-video-call-signal-warning">
                  <span className="elder-video-call-signal-icon">📶</span>
                  信号有点不稳
                </div>
              )}
              {/* 视频画面区域 */}
              <div className="elder-video-call-video-preview">
                <img
                  className="elder-video-call-tablet-img"
                  src={tabletImage}
                  alt="视频通话画面"
                />
                <div className="elder-video-call-self-preview">
                  <span className="elder-video-call-self-icon">🧓</span>
                </div>
              </div>
            </div>
          )}

          {/* 失败 */}
          {status === 'failed' && (
            <div className="elder-video-call-failed">
              <div className="elder-video-call-failed-avatar">
                <span className="elder-video-call-failed-icon">📵</span>
              </div>
              <div className="elder-video-call-failed-text">
                {failedText || '对方暂时无法接听'}
              </div>
            </div>
          )}
        </div>

        {/* ── 字幕/对话区 ── */}
        {status === 'connected' && (
          <div className="elder-video-call-captions">
            {lines.slice(0, currentLineIndex + 1).map((line, idx) => (
              <div
                key={idx}
                className={`elder-video-call-caption ${line.speaker === 'elder' ? 'elder-video-call-caption--elder' : 'elder-video-call-caption--family'}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <span className="elder-video-call-caption-speaker">
                  {line.speaker === 'elder' ? '你' : '家人'}
                </span>
                <span className="elder-video-call-caption-text">{line.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── 底部按钮区 ── */}
        <div className="elder-video-call-actions">
          {status === 'connected' && canHangup && (
            <button
              className="elder-video-call-hangup"
              onClick={onHangup}
            >
              挂断
            </button>
          )}
          {status === 'failed' && (
            <button
              className="elder-video-call-close"
              onClick={onHangup}
            >
              放下平板
            </button>
          )}
          {status === 'connecting' && (
            <div className="elder-video-call-cancel-hint">
              等待中，请稍候{connectingDots}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
