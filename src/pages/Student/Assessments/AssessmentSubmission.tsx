import React from 'react';
import { Card, Result, Button, Typography, Tag, Divider, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';

const { Text } = Typography;

export const AssessmentSubmission: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in velica-submission-wrapper">
      <Card bordered className="velica-submission-card">
        <Result
          status="success"
          title={<span className="velica-submission-title">Nộp bài kiểm tra thành công!</span>}
          subTitle="Hệ thống đã ghi nhận toàn bộ câu trả lời và đồng bộ kết quả lên máy chủ khảo thí Velica."
          extra={[
            <Button
              key="results"
              type="primary"
              onClick={() => navigate('/student/assessments/asm-1/review')}
              className="velica-btn-primary"
            >
              Xem lại bài làm & Lời giải chi tiết
            </Button>,
            <Button
              key="classes"
              onClick={() => navigate(ROUTE_PATHS.STUDENT.CLASSES)}
              className="velica-btn-action"
            >
              Về danh sách lớp học
            </Button>,
          ]}
        />

        <Divider className="my-3" />

        <div className="velica-submission-meta-box">
          <Row gutter={[16, 12]}>
            <Col span={12}>
              <Text type="secondary" className="velica-cell-desc">Thời điểm nộp bài:</Text>
              <div className="velica-cell-title">
                {new Date().toLocaleTimeString('vi-VN')} — {new Date().toLocaleDateString('vi-VN')}
              </div>
            </Col>
            <Col span={12}>
              <Text type="secondary" className="velica-cell-desc">Tình trạng chấm:</Text>
              <div>
                <Tag color="orange" className="velica-tag-pill">Chờ chấm tự luận (Essay)</Tag>
              </div>
            </Col>
            <Col span={12}>
              <Text type="secondary" className="velica-cell-desc">Điểm trắc nghiệm tự động:</Text>
              <div className="velica-score-high">
                5.0 / 5.0 điểm (Đạt 100%)
              </div>
            </Col>
            <Col span={12}>
              <Text type="secondary" className="velica-cell-desc">Số lần vi phạm:</Text>
              <div>
                <Tag color="green" className="velica-tag-pill">0 lần (Tuân thủ tốt)</Tag>
              </div>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );
};
