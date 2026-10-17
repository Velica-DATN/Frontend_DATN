import React from 'react';
import { Zap, ShieldCheck, Target } from 'lucide-react';
import logoFullImg from '../../../assets/velica_logo_full.png';

interface AuthHeroPaneProps {
  headline?: string;
  description?: string;
}

export const AuthHeroPane: React.FC<AuthHeroPaneProps> = ({
  headline = 'Hệ thống Khảo thí Học thuật',
  description = 'Nền tảng tích hợp ma trận Bloom - CLO, giám sát trực tuyến an toàn và đánh giá năng lực học thuật chuẩn hóa tại Velica.',
}) => {
  return (
    <div className="velica-auth-hero-pane">
      {/* Full-bleed background image covering the entire left pane */}
      <img
        src={logoFullImg}
        alt="Velica Academic Assessment System"
        className="velica-auth-hero-bg-img"
      />

      {/* Modern gradient overlay: clear in center for logo, dark at bottom for typography contrast */}
      <div className="velica-auth-hero-overlay" />

      {/* Top Header: Clean Brand Portal Title */}
      <div className="velica-auth-hero-topbar">
        <span className="velica-auth-hero-portal-title">
          CỔNG THÔNG TIN KHẢO THÍ & ĐÁNH GIÁ HỌC THUẬT VELICA
        </span>
      </div>

      {/* Middle Spacer: Keeps the center clear so the full VA VELICA logo in the image is completely visible */}
      <div className="velica-auth-hero-spacer" />

      {/* Bottom Area: Headline & 3 Features (Matching reference photo layout) */}
      <div className="velica-auth-hero-bottom-wrap">
        <div className="velica-auth-hero-text-block">
          <h1 className="velica-auth-hero-main-title">
            Chào mừng bạn đến với<br />
            <span className="velica-auth-gradient-text">{headline}</span>
          </h1>
          <p className="velica-auth-hero-main-desc">
            {description}
          </p>
        </div>

        {/* 3 Value Pillars */}
        <div className="velica-auth-hero-bottom-features">
          <div className="velica-auth-bottom-feature-item">
            <div className="velica-auth-bottom-feature-icon">
              <Zap size={18} className="text-amber-400" />
            </div>
            <div className="velica-auth-bottom-feature-text">
              <div className="velica-auth-bottom-feature-title">Hiệu năng cao</div>
              <div className="velica-auth-bottom-feature-sub">Truy cập dữ liệu thời gian thực</div>
            </div>
          </div>

          <div className="velica-auth-bottom-feature-item">
            <div className="velica-auth-bottom-feature-icon">
              <ShieldCheck size={18} className="text-emerald-400" />
            </div>
            <div className="velica-auth-bottom-feature-text">
              <div className="velica-auth-bottom-feature-title">Bảo mật tuyệt đối</div>
              <div className="velica-auth-bottom-feature-sub">Giám sát trực tuyến & chống gian lận</div>
            </div>
          </div>

          <div className="velica-auth-bottom-feature-item">
            <div className="velica-auth-bottom-feature-icon">
              <Target size={18} className="text-cyan-400" />
            </div>
            <div className="velica-auth-bottom-feature-text">
              <div className="velica-auth-bottom-feature-title">Chuẩn hóa CLO</div>
              <div className="velica-auth-bottom-feature-sub">Ma trận đề thi theo thang Bloom</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
