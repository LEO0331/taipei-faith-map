import { Component } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '../types';

export class ExplorationBoundary extends Component<{ children: ReactNode; language: Language; onReturnMap: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    const zh = this.props.language === 'zh';
    return <div className="discovery-error"><p role="alert">{zh ? '探索內容載入失敗。請返回地圖，重新整理後再試。' : 'Discovery content could not load. Return to the map and refresh to try again.'}</p>
      <button className="text-button" onClick={this.props.onReturnMap}>{zh ? '返回地圖' : 'Return to map'}</button>
    </div>;
  }
}
