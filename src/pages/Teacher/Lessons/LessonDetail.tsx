import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Tag, Table, Popconfirm, message, Divider, Tooltip } from 'antd';
import { ArrowLeft, Trash2, HelpCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Lesson, Question } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { QUESTION_TYPE } from '../../../constants/assessmentConstants';

const { Title, Text, Paragraph } = Typography;

export const LessonDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [les, allQ] = await Promise.all([
      mockService.getLessonById(id || ''),
      mockService.getQuestions({ lessonId: id }),
    ]);
    setLesson(les);
    setQuestions(allQ);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Backlog Domain 2 Item 20: Remove Question from Lesson
  const handleRemoveQuestion = async (qId: string) => {
    await mockService.updateQuestion(qId, { lessonId: undefined, lessonTitle: undefined });
    message.success('Đã gỡ câu hỏi khỏi bài giảng này thành công!');
    loadData();
  };

  const questionColumns = [
    {
      title: 'Nội dung câu hỏi',
      dataIndex: 'content',
      key: 'content',
      render: (content: string, record: Question) => (
        <div className="max-w-440">
          <Tooltip title={content} placement="topLeft">
            <Text strong className="velica-cell-title d-block text-truncate">{content}</Text>
          </Tooltip>
          {record.options && (
            <div className="velica-cell-desc text-xs text-muted-color">
              {record.options.length} phương án lựa chọn
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Loại câu',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={type === QUESTION_TYPE.MCQ ? 'blue' : 'default'} className="velica-tag-pill m-0">
          {type === QUESTION_TYPE.MCQ ? 'Trắc nghiệm' : 'Tự luận'}
        </Tag>
      ),
    },
    {
      title: 'Mức độ',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (diff: string) => <Tag color="cyan" className="m-0">{diff}</Tag>,
    },
    {
      title: 'Điểm',
      dataIndex: 'points',
      key: 'points',
      width: 80,
      render: (points: number) => <span>{points} đ</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      align: 'right' as const,
      render: (_: unknown, record: Question) => (
        <Popconfirm
          title="Xác nhận gỡ câu hỏi này khỏi bài giảng?"
          description="Câu hỏi vẫn được lưu giữ an toàn trong Ngân hàng câu hỏi chung."
          onConfirm={() => handleRemoveQuestion(record.id)}
          okText="Gỡ bỏ"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger size="small" icon={<Trash2 size={15} />}>
            Gỡ khỏi bài
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="velica-back-nav-bar">
        <Button
          type="text"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate(ROUTE_PATHS.TEACHER.LESSONS)}
          className="velica-back-btn"
        >
          Quay lại danh sách chủ đề CLO
        </Button>
      </div>

      {/* Category Header */}
      <Card
        bordered
        className="velica-card mb-4"
      >
        <Space size={8} className="mb-2">
          <Tag color="indigo" className="rounded-2 font-medium">Chủ đề #{lesson?.orderIndex}</Tag>
          <Tag className="rounded-2">{lesson?.syllabusName}</Tag>
          {(lesson?.cloIds && lesson.cloIds.length > 0 ? lesson.cloIds : ['CLO1']).map((clo) => (
            <Tag key={clo} color="blue" className="rounded-2 font-medium">
              {clo}
            </Tag>
          ))}
        </Space>
        <Title level={4} className="velica-page-title">
          {lesson?.title}
        </Title>
        <Paragraph type="secondary" className="velica-page-desc">
          {lesson?.description || 'Phân loại chủ đề kiến thức theo chuẩn đầu ra CLO.'}
        </Paragraph>

        <div className="p-3 bg-light border rounded-2 text-xs text-secondary-color mt-3">
          <strong className="text-primary-color">Định danh Phân loại Khảo thí:</strong> Chủ đề này đóng vai trò là danh mục phân loại (category) theo chuẩn đầu ra CLO của đề cương, dùng làm cơ sở phân bổ câu hỏi trong ngân hàng ({questions.length} câu) và tạo ma trận sinh đề thi tự động.
        </div>
      </Card>

      {/* Associated Questions Table */}
      <Card
        title={
          <div className="d-flex items-center justify-between">
            <span className="font-bold text-sm text-primary-color">
              Câu hỏi trong Ngân hàng thuộc chủ đề này ({questions.length} câu)
            </span>
            <Button
              type="primary"
              size="small"
              onClick={() => navigate(ROUTE_PATHS.TEACHER.QUESTION_BANK)}
              className="velica-btn-primary"
            >
              + Quản lý Ngân hàng câu hỏi
            </Button>
          </div>
        }
        bordered
        className="velica-card-table"
      >
        <Table
          dataSource={questions}
          columns={questionColumns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
};
