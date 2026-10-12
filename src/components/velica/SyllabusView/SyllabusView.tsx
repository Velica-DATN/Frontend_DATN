import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Divider,
  Segmented,
} from 'antd';
import {
  Award,
  CheckSquare,
  Edit,
  Plus,
  Trash2,
  BookOpen,
  Info,
  Layers,
  ArrowRightLeft,
  List as ListIcon,
  LayoutGrid,
  Clock,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';
import { Syllabus, ClassRoom, SyllabusAssessmentItem, LearningObjective } from '../../../interfaces/velica.interfaces';
import { mockService } from '../../../api/mocks/mockService';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';

const { Title, Text, Paragraph } = Typography;

interface SyllabusViewProps {
  syllabus: Syllabus | null;
  classData?: ClassRoom | null;
  editable?: boolean;
  onSyllabusUpdated?: (updated: Syllabus) => void;
  onChangeSyllabus?: () => void;
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  syllabus,
  classData,
  editable = false,
  onSyllabusUpdated,
  onChangeSyllabus,
}) => {
  const navigate = useNavigate();
  const [currentSyllabus, setCurrentSyllabus] = useState<Syllabus | null>(syllabus);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [form] = Form.useForm();
  const watchedObjectives = Form.useWatch('learningObjectives', form);
  const modalAvailableCLOs: string[] = (
    watchedObjectives || currentSyllabus?.learningObjectives || []
  )
    .map((c: any) => c?.code?.trim()?.toUpperCase())
    .filter(Boolean);

  // Sync internal state when prop changes
  React.useEffect(() => {
    setCurrentSyllabus(syllabus);
  }, [syllabus]);

  if (!currentSyllabus) {
    return (
      <Card className="velica-card text-center py-5">
        <Text type="secondary">Chưa tìm thấy dữ liệu đề cương chi tiết cho học phần này.</Text>
      </Card>
    );
  }

  // Open Edit Modal with current data
  const handleOpenEdit = () => {
    form.resetFields();
    form.setFieldsValue({
      name: currentSyllabus.name,
      description: currentSyllabus.description,
      learningObjectives: currentSyllabus.learningObjectives?.map((clo) => ({
        id: clo.id,
        code: clo.code,
        description: clo.description,
      })) || [],
      assessments: currentSyllabus.assessments?.map((asm, idx) => ({
        no: asm.no || idx + 1,
        category: asm.category,
        type: asm.type || 'on-going',
        weight: asm.weight,
        completionCriteria: asm.completionCriteria || '> 0',
        clo: asm.clo || 'CLO1',
        gradingGuide: asm.gradingGuide || '',
      })) || [],
    });
    setIsEditModalOpen(true);
  };

  const handleSaveSyllabus = async () => {
    try {
      const values = await form.validateFields();
      const updatedSyllabus: Syllabus = {
        ...currentSyllabus,
        name: values.name,
        description: values.description,
        learningObjectives: values.learningObjectives || [],
        assessments: values.assessments || [],
        updatedAt: new Date().toISOString(),
      };

      await mockService.updateSyllabus(currentSyllabus.id, updatedSyllabus);
      setCurrentSyllabus(updatedSyllabus);
      setIsEditModalOpen(false);
      message.success('Cập nhật Đề cương môn học (Syllabus) thành công!');
      if (onSyllabusUpdated) {
        onSyllabusUpdated(updatedSyllabus);
      }
    } catch {
      // form error
    }
  };

  // Assessment Scheme Columns
  const assessmentColumns = [
    {
      title: 'STT',
      dataIndex: 'no',
      key: 'no',
      width: 55,
      align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => (
        <span className="font-semibold text-secondary-color">#{idx + 1}</span>
      ),
    },
    {
      title: 'Hạng mục Đánh giá (Category)',
      dataIndex: 'category',
      key: 'category',
      ellipsis: true,
      render: (cat: string) => <Text strong className="text-primary-color text-truncate d-block">{cat}</Text>,
    },
    {
      title: 'Phân loại',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: string) => (
        <Tag color={type === 'Final exam' ? 'volcano' : 'blue'} className="text-xs font-semibold m-0">
          {type === 'Final exam' ? 'Thi Cuối Kỳ' : 'Quá trình'}
        </Tag>
      ),
    },
    {
      title: 'Hình thức đánh giá',
      dataIndex: 'questionType',
      key: 'questionType',
      width: 180,
      ellipsis: true,
      render: (qType?: string) => (
        <Tag color="geekblue" className="text-xs font-medium m-0 text-truncate" style={{ maxWidth: 170 }}>
          {qType || 'Tự luận / Đồ án'}
        </Tag>
      ),
    },
    {
      title: 'Thời lượng',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (dur?: string) => (
        <span className="text-xs text-secondary-color font-medium">{dur || '—'}</span>
      ),
    },
    {
      title: 'Trọng số',
      dataIndex: 'weight',
      key: 'weight',
      width: 90,
      align: 'center' as const,
      render: (w: number) => (
        <span className="font-bold text-brand-color fs-15">{Number(w || 0).toFixed(1)}%</span>
      ),
    },
    {
      title: 'Điều kiện đạt',
      dataIndex: 'completionCriteria',
      key: 'completionCriteria',
      width: 110,
      align: 'center' as const,
      render: (crit: string) => <Tag color="cyan" className="text-xs font-mono m-0">{crit || '> 0'}</Tag>,
    },
    {
      title: 'Chuẩn CLO',
      dataIndex: 'clo',
      key: 'clo',
      width: 140,
      render: (clo: string) => (
        <div className="d-flex gap-1 flex-wrap">
          {(clo || 'CLO1').split(',').map((c) => (
            <Tag key={c.trim()} color="blue" className="text-xs font-semibold m-0">
              {c.trim()}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Hướng dẫn chấm điểm / Rubric',
      dataIndex: 'gradingGuide',
      key: 'gradingGuide',
      ellipsis: true,
      render: (guide: string) => (
        <span className={`text-xs ${guide?.startsWith('Theo Rubric') ? 'text-brand-color font-semibold' : 'text-muted-color'}`}>
          {guide || 'Theo quy chế khảo thí'}
        </span>
      ),
    },
  ];

  const totalWeight = (currentSyllabus.assessments || []).reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);

  return (
    <div className="velica-syllabus-view">
      {/* 1. Header Card with Full Metadata Badges */}
      <Card className="velica-card mb-4 border shadow-xs">
        <div className="d-flex justify-between items-start flex-wrap gap-3">
          <div className="flex-1">
            <div className="d-flex items-center gap-2 flex-wrap mb-2">
              <span className="font-bold text-brand-color text-xs uppercase tracking-wider">
                Đề cương Học phần (Syllabus)
              </span>
              <Tag color="geekblue" className="font-bold text-xs m-0">
                Mã: {currentSyllabus.code}
              </Tag>
              <Tag color="blue" className="font-semibold text-xs m-0">
                {currentSyllabus.credits} tín chỉ
              </Tag>
              <Tag color="cyan" className="font-semibold text-xs m-0">
                Thang điểm {currentSyllabus.scoringScale || 10}
              </Tag>
              <Tag color="green" className="font-semibold text-xs m-0">
                Chuẩn đạt: ≥ {currentSyllabus.minAvgMarkToPass || 5.0}đ
              </Tag>
              {classData && (
                <Tag color="purple" className="font-semibold text-xs m-0">
                  Lớp: {classData.code || classData.name}
                </Tag>
              )}
            </div>

            <h2 className="fs-22 font-bold text-primary-color mb-1">
              {currentSyllabus.name}
            </h2>

            {currentSyllabus.courseNameEnglish && (
              <div className="text-xs text-secondary-color font-medium italic mb-2">
                {currentSyllabus.courseNameEnglish}
              </div>
            )}

            <p className="text-xs text-secondary-color mb-0 leading-relaxed max-w-840">
              {currentSyllabus.description ||
                'Học phần cung cấp kiến thức nền tảng và nâng cao, các bài thực hành và dự án đồ án thực chiến bám sát chuẩn đầu ra.'}
            </p>
          </div>

          {/* Action buttons for Teacher */}
          {editable && (
            <div className="d-flex items-center gap-2 flex-wrap">
              {onChangeSyllabus && (
                <Button
                  icon={<ArrowRightLeft size={14} />}
                  onClick={onChangeSyllabus}
                  className="btn-secondary text-xs"
                >
                  Đổi đề cương gắn kết
                </Button>
              )}
              <Button
                type="primary"
                icon={<Edit size={14} />}
                onClick={() =>
                  navigate(
                    ROUTE_PATHS.TEACHER.SYLLABUS_EDIT.replace(':id', currentSyllabus.id)
                  )
                }
                className="velica-btn-primary"
              >
                Chỉnh sửa Đề cương (Toàn màn hình)
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 2. Thông số Đào tạo & Yêu cầu Học thuật (Academic Specifications Grid) */}
      <Card
        className="velica-card mb-4 border shadow-xs"
        title={
          <div className="d-flex items-center gap-2">
            <Info size={16} className="text-brand-color" />
            <span className="font-bold text-sm text-primary-color">
              Quy cách Đào tạo & Yêu cầu Học thuật
            </span>
          </div>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <div className="p-3 bg-light rounded-3 h-100 border border-light">
              <div className="d-flex items-center gap-2 mb-1.5 text-secondary-color text-xs font-medium">
                <BookOpen size={15} className="text-primary-color" />
                <span>Học phần tiên quyết</span>
              </div>
              <div className="font-semibold text-sm text-primary-color">
                {currentSyllabus.preRequisite ? (
                  <Tag color="volcano" className="font-mono font-bold text-xs m-0">
                    {currentSyllabus.preRequisite}
                  </Tag>
                ) : (
                  <span className="text-muted-color text-xs">Không yêu cầu (Tự do)</span>
                )}
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="p-3 bg-light rounded-3 h-100 border border-light">
              <div className="d-flex items-center gap-2 mb-1.5 text-secondary-color text-xs font-medium">
                <Clock size={15} className="text-brand-color" />
                <span>Phân bổ thời lượng</span>
              </div>
              <div className="font-semibold text-xs text-primary-color leading-snug">
                {currentSyllabus.timeAllocation || '150 giờ (45h liên hệ + 105h tự học)'}
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="p-3 bg-light rounded-3 h-100 border border-light">
              <div className="d-flex items-center gap-2 mb-1.5 text-secondary-color text-xs font-medium">
                <Award size={15} className="text-warning-color" />
                <span>Thang điểm & Chuẩn qua môn</span>
              </div>
              <div className="font-semibold text-xs text-primary-color leading-snug">
                Thang điểm <strong>{currentSyllabus.scoringScale || 10}</strong> • Điểm đạt: <strong>≥ {currentSyllabus.minAvgMarkToPass || 5.0}đ</strong>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div className="p-3 bg-light rounded-3 h-100 border border-light">
              <div className="d-flex items-center gap-2 mb-1.5 text-secondary-color text-xs font-medium">
                <GraduationCap size={15} className="text-success-color" />
                <span>Phương pháp dạy & học</span>
              </div>
              <div className="font-semibold text-xs text-primary-color leading-snug" title={currentSyllabus.learningTeachingMethod}>
                {currentSyllabus.learningTeachingMethod || 'Kiến tạo xã hội, thuyết giảng, thực hành Lab'}
              </div>
            </div>
          </Col>
        </Row>

        {/* Student Tasks if present */}
        {currentSyllabus.studentTasks && currentSyllabus.studentTasks.length > 0 && (
          <div className="mt-3 pt-3 border-top">
            <span className="text-xs font-bold text-secondary-color d-block mb-1.5">
              Nhiệm vụ của sinh viên khi tham gia học phần:
            </span>
            <ul className="mb-0 pl-3 text-xs text-muted-color">
              {currentSyllabus.studentTasks.map((task, tIdx) => (
                <li key={tIdx} className="mb-1">{task}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* 3. Cấu trúc Đánh giá Học phần (Assessment Scheme) */}
      <Card
        className="velica-card mb-4 border shadow-xs"
        title={
          <div className="d-flex items-center justify-between flex-wrap gap-2">
            <div className="d-flex items-center gap-2">
              <CheckSquare size={16} className="text-brand-color" />
              <span className="font-bold text-sm text-primary-color">
                Cấu trúc Đánh giá Học phần ({currentSyllabus.assessments?.length || 0} thành phần)
              </span>
            </div>
            <div className="d-flex items-center gap-2 flex-wrap">
              <Segmented
                size="small"
                value={viewMode}
                onChange={(val) => setViewMode(val as 'list' | 'table')}
                options={[
                  {
                    value: 'list',
                    label: (
                      <span className="d-inline-flex items-center gap-1 font-semibold text-xs">
                        <ListIcon size={13} /> Danh sách
                      </span>
                    ),
                  },
                  {
                    value: 'table',
                    label: (
                      <span className="d-inline-flex items-center gap-1 font-semibold text-xs">
                        <LayoutGrid size={13} /> Bảng
                      </span>
                    ),
                  },
                ]}
              />
              <Tag color={Math.round(totalWeight) === 100 ? 'green' : 'warning'} className="font-semibold text-xs m-0">
                Tổng: {totalWeight.toFixed(1)}% {Math.round(totalWeight) === 100 ? '✓ Đạt 100%' : '⚠️ Chưa đủ 100%'}
              </Tag>
            </div>
          </div>
        }
        bodyStyle={{ padding: viewMode === 'list' ? '12px' : 0 }}
      >
        {viewMode === 'list' ? (
          <div className="d-flex flex-col gap-2">
            {(currentSyllabus.assessments || []).map((item, idx) => (
              <div
                key={`${item.category}-${idx}`}
                className="p-3 border rounded-2 bg-white transition-all hover:border-brand-color shadow-xs"
              >
                <div className="d-flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="d-flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs px-2 py-0.5 rounded bg-subtle text-secondary-color">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-sm text-primary-color">
                      {item.category}
                    </span>
                    <Tag
                      color={item.type === 'Final exam' ? 'volcano' : 'blue'}
                      className="text-xs font-semibold m-0"
                    >
                      {item.type === 'Final exam' ? 'Thi Cuối Kỳ' : 'Quá trình'}
                    </Tag>
                    {item.questionType && (
                      <Tag color="geekblue" className="text-xs font-medium m-0">
                        {item.questionType}
                      </Tag>
                    )}
                    {item.duration && (
                      <span className="text-xs text-muted-color">
                        ⏱️ {item.duration}
                      </span>
                    )}
                  </div>
                  <div className="d-flex items-center gap-2">
                    <span className="text-xs text-muted-color">Trọng số:</span>
                    <span className="font-bold text-brand-color fs-15">
                      {Number(item.weight || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="d-flex items-center justify-between flex-wrap gap-2 text-xs pt-2 border-top">
                  <div className="d-flex items-center gap-2 flex-wrap">
                    <span className="text-muted-color">Chuẩn CLO:</span>
                    {(item.clo || 'CLO1').split(',').map((c) => (
                      <Tag key={c.trim()} color="blue" className="text-xs font-semibold m-0">
                        {c.trim()}
                      </Tag>
                    ))}
                    <span className="text-muted-color ml-2">Điều kiện đạt:</span>
                    <Tag color="cyan" className="text-xs font-mono m-0">
                      {item.completionCriteria || '> 0'}
                    </Tag>
                  </div>
                  <div className={`${item.gradingGuide?.startsWith('Theo Rubric') ? 'text-brand-color font-semibold' : 'text-muted-color'} italic`}>
                    📋 {item.gradingGuide || 'Theo quy chế khảo thí'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Table
            dataSource={currentSyllabus.assessments || []}
            columns={assessmentColumns}
            rowKey={(r, idx) => `${r.category}-${idx}`}
            pagination={false}
            size="middle"
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>

      {/* 4. Chuẩn Đầu ra Môn học (Course Learning Outcomes - CLO) */}
      <Card
        className="velica-card mb-4 border shadow-xs"
        title={
          <div className="d-flex items-center gap-2">
            <Award size={16} className="text-brand-color" />
            <span className="font-bold text-sm text-primary-color">
              Chuẩn Đầu ra Môn học (CLO - Course Learning Outcomes)
            </span>
          </div>
        }
      >
        <Row gutter={[16, 16]}>
          {(currentSyllabus.learningObjectives || []).map((clo, idx) => (
            <Col xs={24} md={12} key={clo.id || clo.code || idx}>
              <div className="p-3 bg-light border rounded-3 h-100 d-flex flex-col justify-between">
                <div>
                  <div className="d-flex items-center justify-between mb-2">
                    <Tag color="blue" className="font-bold text-xs m-0">
                      {clo.code}
                    </Tag>
                    <span className="badge bg-white border text-secondary-color text-xs">
                      Mức Bloom 3-4
                    </span>
                  </div>
                  <div className="text-xs text-primary-color font-medium leading-relaxed">
                    {clo.description}
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 5. Giáo trình & Tài liệu Tham khảo (Course Materials) */}
      {currentSyllabus.materials && currentSyllabus.materials.length > 0 && (
        <Card
          className="velica-card mb-4 border shadow-xs"
          title={
            <div className="d-flex items-center gap-2">
              <BookOpen size={16} className="text-brand-color" />
              <span className="font-bold text-sm text-primary-color">
                Giáo trình & Tài liệu Tham khảo ({currentSyllabus.materials.length})
              </span>
            </div>
          }
        >
          <div className="d-flex flex-col gap-2">
            {currentSyllabus.materials.map((mat, mIdx) => (
              <div
                key={mIdx}
                className="p-2.5 bg-light rounded border border-light d-flex items-center justify-between flex-wrap gap-2 text-xs"
              >
                <div>
                  <div className="d-flex items-center gap-2">
                    <span className="font-bold text-primary-color">{mat.description}</span>
                    {mat.isMainMaterial && (
                      <Tag color="volcano" className="font-bold text-2xs py-0 px-1 m-0">
                        Giáo trình chính
                      </Tag>
                    )}
                    {mat.isOnline && (
                      <Tag color="blue" className="text-2xs py-0 px-1 m-0">
                        Online
                      </Tag>
                    )}
                  </div>
                  <div className="text-secondary-color mt-0.5">
                    Tác giả: <strong>{mat.author}</strong> • Nhà xuất bản: {mat.publisher}
                    {mat.isbn && ` • ISBN: ${mat.isbn}`}
                  </div>
                </div>

                {mat.url && (
                  <Button
                    type="link"
                    size="small"
                    href={mat.url}
                    target="_blank"
                    icon={<ExternalLink size={12} />}
                    className="p-0 text-xs font-semibold"
                  >
                    Xem tài liệu
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Full CRUD Drawer / Modal for Editing Syllabus, CLOs & Assessments */}
      <Modal
        title={
          <div className="d-flex items-center gap-2">
            <Edit size={18} className="text-brand-color" />
            <span className="font-bold text-base">Chỉnh sửa Đề cương môn học (Syllabus CRUD)</span>
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={handleSaveSyllabus}
        okText="Lưu thay đổi Đề cương"
        cancelText="Hủy"
        width={820}
        destroyOnClose
        bodyStyle={{ maxHeight: 'calc(80vh - 120px)', overflowY: 'auto', paddingRight: '8px' }}
      >
        <div className="mb-3 p-2 bg-brand-light rounded border border-brand-color d-flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-secondary-color">
            💡 Gợi ý: Bạn có thể mở giao diện toàn màn hình để dễ dàng cấu hình CLO và các thành phần đánh giá.
          </span>
          <Button
            size="small"
            type="primary"
            onClick={() => {
              setIsEditModalOpen(false);
              navigate(
                ROUTE_PATHS.TEACHER.SYLLABUS_EDIT.replace(':id', currentSyllabus.id)
              );
            }}
            className="text-xs velica-btn-primary"
          >
            Mở trang chỉnh sửa Toàn màn hình ↗
          </Button>
        </div>

        <Form form={form} layout="vertical" className="pt-2">
          <Form.Item
            name="name"
            label={<strong className="text-xs">Tên Đề cương môn học</strong>}
            rules={[{ required: true, message: 'Vui lòng nhập tên đề cương' }]}
          >
            <Input placeholder="Vd: Kiến Trúc Phần Mềm Hiện Đại" />
          </Form.Item>

          <Form.Item
            name="description"
            label={<strong className="text-xs">Mô tả tóm tắt học phần</strong>}
          >
            <Input.TextArea rows={2} placeholder="Nội dung tổng quan của môn học..." />
          </Form.Item>

          <Divider className="my-3" />

          {/* CLOs CRUD Section */}
          <div className="d-flex justify-between items-center mb-2">
            <div>
              <strong className="text-xs text-primary-color d-block">Danh sách Chuẩn đầu ra (CLO)</strong>
              <span className="text-xs text-muted-color">Khai báo mã CLO và mô tả năng lực đầu ra</span>
            </div>
          </div>

          <Form.List name="learningObjectives">
            {(fields, { add, remove }) => (
              <div className="d-flex flex-col gap-2 mb-4">
                {fields.map(({ key, name, ...restField }, idx) => (
                  <div key={key} className="p-3 bg-light border rounded-2 d-flex gap-2 items-start">
                    <Form.Item
                      {...restField}
                      name={[name, 'code']}
                      rules={[{ required: true, message: 'Nhập mã CLO' }]}
                      className="mb-0 w-110"
                    >
                      <Input placeholder={`CLO${idx + 1}`} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'description']}
                      rules={[{ required: true, message: 'Nhập mô tả chuẩn đầu ra' }]}
                      className="mb-0 flex-1"
                    >
                      <Input placeholder="Mô tả năng lực chuẩn đầu ra đạt được..." />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<Trash2 size={15} />}
                        onClick={() => remove(name)}
                        className="mt-1"
                      />
                    )}
                  </div>
                ))}
                <Button
                  type="dashed"
                  icon={<Plus size={14} />}
                  onClick={() => add({ code: `CLO${fields.length + 1}`, description: '' })}
                  className="w-100"
                >
                  Thêm Chuẩn đầu ra (CLO)
                </Button>
              </div>
            )}
          </Form.List>

          <Divider className="my-3" />

          {/* Assessment Scheme CRUD Section */}
          <div className="d-flex justify-between items-center mb-2">
            <div>
              <strong className="text-xs text-primary-color d-block">Cấu trúc Đánh giá Học phần</strong>
              <span className="text-xs text-muted-color">Khai báo các thành phần đánh giá quá trình và thi cuối kỳ</span>
            </div>
          </div>

          <Form.List name="assessments">
            {(fields, { add, remove }) => (
              <div className="d-flex flex-col gap-2">
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="p-3 bg-light border rounded-2">
                    <div className="d-flex justify-between items-center mb-2">
                      <span className="font-semibold text-xs text-brand-color">Thành phần #{name + 1}</span>
                      {fields.length > 1 && (
                        <Trash2
                          size={15}
                          className="text-danger-color cursor-pointer"
                          onClick={() => remove(name)}
                        />
                      )}
                    </div>
                    <Row gutter={8}>
                      <Col span={9}>
                        <Form.Item
                          {...restField}
                          name={[name, 'category']}
                          label={<span className="text-xs">Tên hạng mục</span>}
                          rules={[{ required: true, message: 'Nhập tên' }]}
                          className="mb-2"
                        >
                          <Input placeholder="Vd: Assignment / Final Exam" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, 'type']}
                          label={<span className="text-xs">Phân loại</span>}
                          rules={[{ required: true }]}
                          className="mb-2"
                        >
                          <Select
                            options={[
                              { label: 'Quá trình', value: 'on-going' },
                              { label: 'Cuối kỳ', value: 'Final exam' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, 'weight']}
                          label={<span className="text-xs">Trọng số (%)</span>}
                          rules={[{ required: true, message: 'Nhập %' }]}
                          className="mb-2"
                        >
                          <InputNumber min={1} max={100} addonAfter="%" className="w-100" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, 'clo']}
                          label={<span className="text-xs">Chuẩn CLO</span>}
                          className="mb-1"
                        >
                          <Input placeholder="CLO1, CLO2" />
                        </Form.Item>
                        {modalAvailableCLOs.length > 0 && (
                          <div className="d-flex items-center gap-1 flex-wrap mb-2">
                            {modalAvailableCLOs.map((code) => (
                              <Tag
                                key={code}
                                className="cursor-pointer text-xs m-0 px-1 py-0"
                                onClick={() => {
                                  const current = form.getFieldValue(['assessments', name, 'clo']) || '';
                                  const list = current
                                    .split(',')
                                    .map((x: string) => x.trim().toUpperCase())
                                    .filter(Boolean);
                                  const updated = list.includes(code)
                                    ? list.filter((x: string) => x !== code)
                                    : [...list, code];
                                  const currentAssessments = form.getFieldValue('assessments') || [];
                                  currentAssessments[name] = {
                                    ...currentAssessments[name],
                                    clo: updated.join(', '),
                                  };
                                  form.setFieldsValue({ assessments: [...currentAssessments] });
                                }}
                              >
                                + {code}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </Col>
                    </Row>
                  </div>
                ))}
                <Button
                  type="dashed"
                  icon={<Plus size={14} />}
                  onClick={() =>
                    add({
                      category: 'Kiểm tra quá trình',
                      type: 'on-going',
                      weight: 10,
                      completionCriteria: '> 0',
                      clo: 'CLO1',
                    })
                  }
                  className="w-100"
                >
                  Thêm Thành phần Đánh giá
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};
