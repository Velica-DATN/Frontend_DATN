import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Tag,
  Table,
  Button,
  Descriptions,
  Space,
  Empty,
} from 'antd';
import {
  BookOpen,
  Target,
  Award,
  Edit,
  ArrowRightLeft,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ExternalLink,
} from 'lucide-react';
import {
  Syllabus,
  ClassRoom,
  SyllabusAssessmentItem,
  LearningObjective,
  Lesson,
} from '../../../interfaces/velica.interfaces';
import { mockService } from '../../../api/mocks/mockService';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';

const { Text } = Typography;

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
  onChangeSyllabus,
}) => {
  const navigate = useNavigate();
  const [currentSyllabus, setCurrentSyllabus] = useState<Syllabus | null>(syllabus);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  useEffect(() => {
    setCurrentSyllabus(syllabus);
  }, [syllabus]);

  useEffect(() => {
    if (currentSyllabus?.id) {
      setLoadingLessons(true);
      mockService.getLessons(currentSyllabus.id).then((data) => {
        setLessons(data);
        setLoadingLessons(false);
      });
    }
  }, [currentSyllabus?.id]);

  if (!currentSyllabus) {
    return (
      <Card className="velica-card text-center py-5">
        <Text type="secondary">Chưa tìm thấy dữ liệu đề cương chi tiết cho học phần này.</Text>
      </Card>
    );
  }

  // Calculate total assessment weight
  const totalWeight = (currentSyllabus.assessments || []).reduce(
    (acc, curr) => acc + (Number(curr.weight) || 0),
    0
  );

  // CLO Table Columns (FLM Style)
  const cloColumns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => (
        <span className="font-semibold text-secondary-color">#{idx + 1}</span>
      ),
    },
    {
      title: 'Mã CLO',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => (
        <Tag color="blue" className="font-mono font-bold text-xs m-0 px-2 py-0.5">
          {code}
        </Tag>
      ),
    },
    {
      title: 'Mô tả Chuẩn đầu ra Học phần (CLO Description)',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => (
        <span className="text-sm text-primary-color leading-relaxed font-normal">
          {desc}
        </span>
      ),
    },
  ];

  // Assessment Scheme Columns (FLM Style)
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
      render: (cat: string) => (
        <Text strong className="text-primary-color">
          {cat}
        </Text>
      ),
    },
    {
      title: 'Phân loại',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: string) => (
        <Tag
          color={type === 'Final exam' ? 'volcano' : 'blue'}
          className="text-xs font-semibold m-0"
        >
          {type === 'Final exam' ? 'Thi Cuối Kỳ' : 'Quá trình'}
        </Tag>
      ),
    },
    {
      title: 'Trọng số',
      dataIndex: 'weight',
      key: 'weight',
      width: 95,
      align: 'center' as const,
      render: (w: number) => (
        <span className="font-bold text-brand-color fs-14">
          {Number(w || 0).toFixed(1)}%
        </span>
      ),
    },
    {
      title: 'Chuẩn CLO',
      dataIndex: 'clo',
      key: 'clo',
      width: 150,
      render: (clo: string | string[]) => {
        const cloList = Array.isArray(clo)
          ? clo
          : typeof clo === 'string'
          ? clo.split(',').map((c) => c.trim()).filter(Boolean)
          : [];

        return (
          <div className="d-flex gap-1 flex-wrap">
            {cloList.length > 0 ? (
              cloList.map((c) => (
                <Tag key={c} color="blue" className="text-xs font-semibold m-0">
                  {c}
                </Tag>
              ))
            ) : (
              <span className="text-muted-color text-xs">—</span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Hình thức đánh giá',
      dataIndex: 'questionType',
      key: 'questionType',
      width: 170,
      ellipsis: true,
      render: (qType?: string) => (
        <Tag color="geekblue" className="text-xs font-medium m-0 text-truncate" style={{ maxWidth: 160 }}>
          {qType || 'Tự luận / Đồ án'}
        </Tag>
      ),
    },
    {
      title: 'Thời lượng',
      dataIndex: 'duration',
      key: 'duration',
      width: 105,
      render: (dur?: string) => (
        <span className="text-xs text-secondary-color font-medium">{dur || '—'}</span>
      ),
    },
    {
      title: 'Điều kiện đạt',
      dataIndex: 'completionCriteria',
      key: 'completionCriteria',
      width: 110,
      align: 'center' as const,
      render: (crit?: string) => (
        <Tag color="cyan" className="text-xs font-mono m-0">
          {crit || '> 0'}
        </Tag>
      ),
    },
    {
      title: 'Hướng dẫn chấm / Rubric',
      dataIndex: 'gradingGuide',
      key: 'gradingGuide',
      ellipsis: true,
      render: (guide?: string) => (
        <span
          className={`text-xs ${
            guide?.startsWith('Theo Rubric')
              ? 'text-brand-color font-semibold'
              : 'text-secondary-color'
          }`}
        >
          {guide || 'Theo quy chế khảo thí'}
        </span>
      ),
    },
  ];

  // Topics & Lessons Table Columns
  const lessonColumns = [
    {
      title: 'Thứ tự',
      dataIndex: 'orderIndex',
      key: 'orderIndex',
      width: 85,
      align: 'center' as const,
      render: (idx: number, record: Lesson, i: number) => (
        <Tag color="geekblue" className="font-semibold text-xs m-0">
          Bài {record.orderIndex || i + 1}
        </Tag>
      ),
    },
    {
      title: 'Tên Chủ đề & Nội dung Trọng tâm',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Lesson) => (
        <div style={{ maxWidth: 460 }}>
          <div
            className="font-semibold text-primary-color fs-14 cursor-pointer hover:text-brand-color transition-colors"
            onClick={() =>
              navigate(ROUTE_PATHS.TEACHER.LESSONS_DETAIL.replace(':id', record.id))
            }
          >
            {title}
          </div>
          {record.description && (
            <div className="text-xs text-secondary-color mt-1 leading-relaxed">
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Chuẩn CLO',
      dataIndex: 'cloIds',
      key: 'cloIds',
      width: 150,
      render: (cloIds?: string[]) => {
        const list = cloIds && cloIds.length > 0 ? cloIds : ['CLO1'];
        return (
          <div className="d-flex gap-1 flex-wrap">
            {list.map((clo) => (
              <Tag key={clo} color="blue" className="text-xs font-semibold m-0">
                {clo}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Ngân hàng câu hỏi',
      dataIndex: 'questionCount',
      key: 'questionCount',
      width: 150,
      align: 'center' as const,
      render: (count: number) => (
        <Tag color="purple" className="text-xs font-medium m-0 px-2 py-0.5">
          {count || 0} câu hỏi
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      align: 'right' as const,
      render: (_: unknown, record: Lesson) => (
        <Button
          type="link"
          size="small"
          icon={<ExternalLink size={13} />}
          onClick={() =>
            navigate(ROUTE_PATHS.TEACHER.LESSONS_DETAIL.replace(':id', record.id))
          }
          className="text-xs font-semibold p-0"
        >
          Xem câu hỏi
        </Button>
      ),
    },
  ];

  return (
    <div className="velica-syllabus-view">
      {/* =====================================================================
          Header Card with Academic Metadata
          ===================================================================== */}
      <Card className="velica-card mb-4 border shadow-xs">
        <div className="d-flex justify-between items-start flex-wrap gap-3">
          <div className="flex-1">
            <div className="d-flex items-center gap-2 flex-wrap mb-2">
              <span className="font-bold text-brand-color text-xs uppercase tracking-wider">
                Đề cương Học phần (Syllabus Chi tiết)
              </span>
              <Tag color="geekblue" className="font-bold text-xs m-0">
                Mã: {currentSyllabus.code}
              </Tag>
              <Tag color="cyan" className="font-semibold text-xs m-0">
                Thang điểm {currentSyllabus.scoringScale || 10}
              </Tag>
              <Tag color="green" className="font-semibold text-xs m-0">
                Chuẩn đạt: ≥ {currentSyllabus.minAvgMarkToPass || 4.0}đ
              </Tag>
              {classData && (
                <Tag color="purple" className="font-semibold text-xs m-0">
                  Lớp: {classData.code || classData.name}
                </Tag>
              )}
            </div>

            <h1 className="fs-22 font-bold text-primary-color mb-1">
              {currentSyllabus.name}
            </h1>

            {currentSyllabus.courseNameEnglish && (
              <div className="text-xs text-secondary-color font-medium italic mb-2">
                {currentSyllabus.courseNameEnglish}
              </div>
            )}

            <p className="text-xs text-secondary-color mb-0 leading-relaxed max-w-840">
              {currentSyllabus.description ||
                'Học phần cung cấp kiến thức nền tảng và nâng cao, các bài thực hành và dự án thực chiến bám sát chuẩn đầu ra.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="d-flex items-center gap-2 flex-wrap no-print">
            <Button
              icon={<Printer size={14} />}
              onClick={() => window.print()}
              className="velica-btn-action text-xs"
            >
              In đề cương
            </Button>
            {editable && (
              <>
                {onChangeSyllabus && (
                  <Button
                    icon={<ArrowRightLeft size={14} />}
                    onClick={onChangeSyllabus}
                    className="velica-btn-action text-xs"
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
                  className="velica-btn-primary text-xs"
                >
                  Chỉnh sửa Đề cương
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* =====================================================================
          Section 1: Thông tin Chung Học phần (FLM Academic Specification Table)
          ===================================================================== */}
      <Card
        className="velica-card mb-4 border shadow-xs"
        title={
          <div className="d-flex items-center gap-2">
            <BookOpen size={17} className="text-brand-color" />
            <span className="font-bold text-sm text-primary-color">
              1. Thông tin Chung Học phần (General Information)
            </span>
          </div>
        }
      >
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2, md: 2 }}
          className="velica-flm-descriptions"
        >
          <Descriptions.Item label="Mã học phần (Course Code)">
            <span className="font-mono font-bold text-primary-color">
              {currentSyllabus.code}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Trình độ đào tạo (Degree Level)">
            <span className="font-medium">
              {currentSyllabus.degreeLevel || 'Đại học (Bachelor)'}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Tên học phần (Tiếng Việt)">
            <strong className="text-primary-color">{currentSyllabus.name}</strong>
          </Descriptions.Item>

          <Descriptions.Item label="Tên tiếng Anh (English Name)">
            <span className="italic text-secondary-color">
              {currentSyllabus.courseNameEnglish || '—'}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Thang điểm đánh giá">
            <span>Thang {currentSyllabus.scoringScale || 10} điểm</span>
          </Descriptions.Item>

          <Descriptions.Item label="Chuẩn điểm đạt tối thiểu (Min Pass Mark)">
            <span className="font-semibold text-success-color">
              ≥ {currentSyllabus.minAvgMarkToPass || 4.0} / {currentSyllabus.scoringScale || 10} điểm
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Học phần tiên quyết (Prerequisite)">
            {currentSyllabus.preRequisite ? (
              <Tag color="volcano" className="font-mono font-bold text-xs m-0">
                {currentSyllabus.preRequisite}
              </Tag>
            ) : (
              <span className="text-secondary-color">Không yêu cầu (Tự do)</span>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Phân bổ thời gian (Time Allocation)">
            <span className="text-xs font-medium">
              {currentSyllabus.timeAllocation || '150 giờ (45h liên hệ trên lớp + 105h tự học)'}
            </span>
          </Descriptions.Item>

          <Descriptions.Item
            label="Phương pháp giảng dạy & học tập"
            span={2}
          >
            <span className="text-xs">
              {currentSyllabus.learningTeachingMethod ||
                'Kiến tạo xã hội, thuyết giảng kết hợp bài tập thực chiến, phản biện và làm việc nhóm.'}
            </span>
          </Descriptions.Item>

          <Descriptions.Item
            label="Mô tả mục tiêu môn học (Course Description)"
            span={2}
          >
            <p className="text-xs text-secondary-color mb-0 leading-relaxed">
              {currentSyllabus.description ||
                'Chương trình trang bị nền tảng lý thuyết vững chắc cùng kỹ năng thực hành chuyên sâu theo chuẩn đầu ra ngành công nghệ.'}
            </p>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* =====================================================================
          Section 2: Chuẩn đầu ra môn học (CLO - Course Learning Objectives)
          ===================================================================== */}
      <Card
        className="velica-card mb-4 border shadow-xs"
        title={
          <div className="d-flex items-center justify-between flex-wrap gap-2">
            <div className="d-flex items-center gap-2">
              <Target size={17} className="text-brand-color" />
              <span className="font-bold text-sm text-primary-color">
                2. Chuẩn đầu ra môn học (Course Learning Objectives - CLO)
              </span>
            </div>
            <Tag color="blue" className="font-semibold text-xs m-0">
              {currentSyllabus.learningObjectives?.length || 0} chuẩn CLO
            </Tag>
          </div>
        }
      >
        <Table
          dataSource={currentSyllabus.learningObjectives || []}
          columns={cloColumns}
          rowKey={(r, idx) => r.code || r.id || String(idx)}
          pagination={false}
          size="middle"
          bordered
          className="velica-flm-table"
        />
      </Card>

      {/* =====================================================================
          Section 3: Cấu trúc & Kế hoạch Đánh giá Học phần (Assessment Scheme)
          ===================================================================== */}
      <Card
        className="velica-card mb-4 border shadow-xs"
        title={
          <div className="d-flex items-center justify-between flex-wrap gap-2">
            <div className="d-flex items-center gap-2">
              <Award size={17} className="text-brand-color" />
              <span className="font-bold text-sm text-primary-color">
                3. Cấu trúc & Điểm thành phần Đánh giá (Assessment Scheme)
              </span>
            </div>
            <Tag
              color={Math.round(totalWeight) === 100 ? 'green' : 'warning'}
              className="font-semibold text-xs m-0 d-inline-flex items-center gap-1"
            >
              {Math.round(totalWeight) === 100 ? (
                <>
                  <CheckCircle2 size={13} /> Tổng: {totalWeight.toFixed(1)}% (Đạt 100%)
                </>
              ) : (
                <>
                  <AlertTriangle size={13} /> Tổng: {totalWeight.toFixed(1)}% (Chưa đủ 100%)
                </>
              )}
            </Tag>
          </div>
        }
      >
        <Table
          dataSource={currentSyllabus.assessments || []}
          columns={assessmentColumns}
          rowKey={(r, idx) => `${r.category}-${idx}`}
          pagination={false}
          size="middle"
          bordered
          className="velica-flm-table"
          scroll={{ x: 'max-content' }}
          summary={() => (
            <Table.Summary.Row style={{ backgroundColor: '#F8FAFC' }}>
              <Table.Summary.Cell index={0} colSpan={3} align="right">
                <span className="font-bold text-xs uppercase tracking-wider text-primary-color">
                  Tổng cộng Trọng số Đánh giá (Total Weight)
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="center">
                <span className="font-bold text-brand-color fs-15">
                  {totalWeight.toFixed(1)}%
                </span>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} colSpan={5}>
                <span className="text-xs text-secondary-color font-medium">
                  {Math.round(totalWeight) === 100
                    ? 'Bao phủ 100% các chuẩn đầu ra (CLO) theo quy chế khảo thí học phần.'
                    : 'Lưu ý: Tổng trọng số các thành phần chưa bằng đúng 100%.'}
                </span>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>

      {/* =====================================================================
          Section 4: Kế hoạch Giảng dạy & Danh mục Chủ đề Học phần (Course Topics & Lessons)
          ===================================================================== */}
      <Card
        className="velica-card mb-4 border shadow-xs"
        title={
          <div className="d-flex items-center justify-between flex-wrap gap-2">
            <div className="d-flex items-center gap-2">
              <Layers size={17} className="text-brand-color" />
              <span className="font-bold text-sm text-primary-color">
                4. Danh mục Chủ đề & Kế hoạch Bài giảng (Course Topics & Lessons)
              </span>
            </div>
            <div className="d-flex items-center gap-2">
              <Tag color="geekblue" className="font-semibold text-xs m-0">
                {lessons.length} chủ đề bài giảng
              </Tag>
              {editable && (
                <Button
                  size="small"
                  type="primary"
                  icon={<ExternalLink size={13} />}
                  onClick={() =>
                    navigate(`${ROUTE_PATHS.TEACHER.LESSONS}?syllabusId=${currentSyllabus.id}`)
                  }
                  className="velica-btn-primary text-xs"
                >
                  Quản lý Chủ đề theo Đề cương ↗
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="text-xs text-secondary-color mb-3">
          Danh mục các chủ đề bài giảng thuộc đề cương này. Mỗi chủ đề được ánh xạ với Chuẩn đầu ra (CLO) tương ứng và kết nối trực tiếp với Ngân hàng câu hỏi phục vụ giảng dạy và ra đề thi.
        </div>
        <Table
          dataSource={lessons}
          columns={lessonColumns}
          rowKey="id"
          loading={loadingLessons}
          pagination={false}
          size="middle"
          bordered
          className="velica-flm-table"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có chủ đề bài giảng nào được cấu hình cho đề cương này."
              >
                {editable && (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() =>
                      navigate(`${ROUTE_PATHS.TEACHER.LESSONS}?syllabusId=${currentSyllabus.id}`)
                    }
                  >
                    Thêm chủ đề mới cho đề cương
                  </Button>
                )}
              </Empty>
            ),
          }}
        />
      </Card>
    </div>
  );
};
