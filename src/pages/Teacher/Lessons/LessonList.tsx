import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Space, message, Popconfirm, Tag, Tooltip, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus, Eye, Edit, Trash2, BookOpen, ExternalLink, Layers } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Lesson, Syllabus } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';
import { LessonFormDrawer, LessonFormValues } from './components/LessonFormDrawer';

export const LessonList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Single Source of Truth: derive directly from searchParams
  const selectedSyllabus = searchParams.get('syllabusId') || undefined;

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Load data callback memoized on selectedSyllabus
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [lesList, sylList] = await Promise.all([
        mockService.getLessons(selectedSyllabus),
        mockService.getSyllabi(),
      ]);
      setLessons(lesList);
      setSyllabi(sylList);
    } catch {
      message.error('Không thể tải danh sách chủ đề bài học.');
    } finally {
      setLoading(false);
    }
  }, [selectedSyllabus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSyllabusFilterChange = useCallback(
    (val: string | undefined) => {
      if (val) {
        setSearchParams({ syllabusId: val });
      } else {
        setSearchParams({});
      }
    },
    [setSearchParams]
  );

  const handleOpenCreate = useCallback(() => {
    setEditingLesson(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((les: Lesson) => {
    setEditingLesson(les);
    setIsModalOpen(true);
  }, []);

  const handleFormSubmit = useCallback(
    async (values: LessonFormValues) => {
      const payload = {
        ...values,
        content: values.content || values.description || '',
      };
      if (editingLesson) {
        await mockService.updateLesson(editingLesson.id, payload);
        message.success('Cập nhật chủ đề theo đề cương thành công!');
      } else {
        await mockService.createLesson(payload);
        message.success('Tạo chủ đề mới cho đề cương thành công!');
      }
      setIsModalOpen(false);
      loadData();
    },
    [editingLesson, loadData]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await mockService.deleteLesson(id);
      message.success('Đã xóa chủ đề khỏi đề cương.');
      loadData();
    },
    [loadData]
  );

  // Filter lessons with useMemo to avoid re-calculating on unrelated renders
  const filteredLessons = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return lessons;
    return lessons.filter(
      (l) =>
        l.title.toLowerCase().includes(query) ||
        l.description.toLowerCase().includes(query)
    );
  }, [lessons, search]);

  // Active selected syllabus object memoized
  const activeSyllabus = useMemo(
    () => syllabi.find((s) => s.id === selectedSyllabus),
    [syllabi, selectedSyllabus]
  );

  // Table Columns strictly typed with ColumnsType<Lesson> and memoized
  const columns: ColumnsType<Lesson> = useMemo(
    () => [
      {
        title: 'Thứ tự',
        dataIndex: 'orderIndex',
        key: 'orderIndex',
        width: 75,
        align: 'center',
        render: (orderIndex: number) => (
          <Tag color="geekblue" className="m-0 font-semibold text-xs">
            Bài {orderIndex}
          </Tag>
        ),
      },
      {
        title: 'Tên Chủ đề & Phạm vi Kiến thức',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        render: (title: string, record: Lesson) => (
          <div className="overflow-hidden">
            <button
              type="button"
              className="velica-cell-title text-left bg-transparent border-0 p-0 cursor-pointer hover:text-brand-color transition-colors d-block truncate font-semibold"
              onClick={() => navigate(ROUTE_PATHS.TEACHER.LESSONS_DETAIL.replace(':id', record.id))}
              title={title}
              aria-label={`Xem chi tiết chủ đề: ${title}`}
            >
              {title}
            </button>
            <span
              className="velica-cell-desc text-muted-color d-block truncate"
              title={record.description}
            >
              {record.description}
            </span>
          </div>
        ),
      },
      {
        title: 'Thuộc Đề cương Môn học',
        dataIndex: 'syllabusName',
        key: 'syllabusName',
        width: 220,
        render: (name: string, record: Lesson) => (
          <button
            type="button"
            className="cursor-pointer d-inline-flex items-center gap-1.5 text-brand-color font-semibold hover:underline max-w-full bg-transparent border-0 p-0 text-left"
            onClick={() =>
              navigate(ROUTE_PATHS.TEACHER.SYLLABUS_DETAIL.replace(':id', record.syllabusId))
            }
            title="Bấm để xem chi tiết Đề cương học phần này"
            aria-label={`Mở đề cương môn học ${name || 'liên kết'}`}
          >
            <BookOpen size={14} className="flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{name || 'Xem đề cương'}</span>
            <ExternalLink size={12} className="flex-shrink-0 text-muted-color" aria-hidden="true" />
          </button>
        ),
      },
      {
        title: 'Chuẩn CLO',
        dataIndex: 'cloIds',
        key: 'cloIds',
        width: 130,
        render: (cloIds: string[] | undefined) => {
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
        width: 130,
        align: 'center',
        render: (count: number) => (
          <Tag color="purple" className="text-xs font-medium m-0 px-2 py-0.5">
            {count || 0} câu hỏi
          </Tag>
        ),
      },
      {
        title: 'Thao tác',
        key: 'action',
        width: 140,
        align: 'right',
        render: (_: unknown, record: Lesson) => (
          <Space size="small">
            <Tooltip title="Xem danh sách câu hỏi của chủ đề này">
              <Button
                type="text"
                size="small"
                icon={<Eye size={15} className="text-brand-color" aria-hidden="true" />}
                onClick={() => navigate(ROUTE_PATHS.TEACHER.LESSONS_DETAIL.replace(':id', record.id))}
                aria-label={`Xem câu hỏi của chủ đề ${record.title}`}
              >
                Câu hỏi
              </Button>
            </Tooltip>
            <Tooltip title="Chỉnh sửa chủ đề">
              <Button
                type="text"
                size="small"
                icon={<Edit size={15} color="#64748B" aria-hidden="true" />}
                onClick={() => handleOpenEdit(record)}
                aria-label={`Chỉnh sửa chủ đề ${record.title}`}
              />
            </Tooltip>
            <Popconfirm
              title="Xác nhận xóa chủ đề này?"
              description="Chủ đề sẽ bị xóa khỏi đề cương môn học."
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Xóa chủ đề">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<Trash2 size={15} aria-hidden="true" />}
                  aria-label={`Xóa chủ đề ${record.title}`}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [navigate, handleOpenEdit, handleDelete]
  );

  return (
    <div className="animate-fade-in">
      {/* Modern Header */}
      <header className="velica-page-header">
        <div className="velica-page-header-start">
          <h1 className="velica-page-title">
            Quản lý Chủ đề theo Đề cương Môn học (Course Topics & Lessons)
          </h1>
          <p className="velica-page-desc">
            Danh mục chủ đề/bài giảng theo từng Đề cương môn học. Mỗi chủ đề được ánh xạ trực tiếp
            với Chuẩn đầu ra (CLO) của đề cương và kết nối với Ngân hàng câu hỏi phục vụ giảng dạy,
            ra đề thi.
          </p>
        </div>

        <div className="velica-page-header-end">
          <Button
            type="primary"
            icon={<Plus size={16} aria-hidden="true" />}
            onClick={handleOpenCreate}
            className="velica-btn-primary"
            aria-label="Tạo chủ đề mới cho đề cương"
          >
            Tạo chủ đề mới
          </Button>
        </div>
      </header>

      {/* Prominent Syllabus Context Banner if selected */}
      {activeSyllabus && (
        <section
          aria-label="Thông tin đề cương đang lọc"
          className="velica-card mb-3 p-3 bg-white border rounded-3 shadow-xs d-flex justify-between items-center flex-wrap gap-3"
        >
          <div className="d-flex items-center gap-3">
            <div
              className="p-2 bg-indigo-50 text-brand-color rounded-2 d-flex items-center justify-center"
              style={{ width: 42, height: 42 }}
              aria-hidden="true"
            >
              <Layers size={22} />
            </div>
            <div>
              <div className="d-flex items-center gap-2 flex-wrap">
                <Tag color="geekblue" className="font-bold text-xs m-0">
                  {activeSyllabus.code}
                </Tag>
                <span className="font-bold text-primary-color fs-15">{activeSyllabus.name}</span>
              </div>
              <div className="text-xs text-secondary-color mt-0.5">
                Đang hiển thị {filteredLessons.length} chủ đề bài giảng thuộc đề cương này •{' '}
                {activeSyllabus.learningObjectives?.length || 0} chuẩn đầu ra CLO • Thang điểm{' '}
                {activeSyllabus.scoringScale || 10}
              </div>
            </div>
          </div>
          <div className="d-flex items-center gap-2">
            <Button
              icon={<BookOpen size={14} aria-hidden="true" />}
              onClick={() =>
                navigate(ROUTE_PATHS.TEACHER.SYLLABUS_DETAIL.replace(':id', activeSyllabus.id))
              }
              className="velica-btn-action text-xs"
              aria-label={`Xem chi tiết đề cương ${activeSyllabus.name}`}
            >
              Xem chi tiết Đề cương này ↗
            </Button>
            <Button
              type="primary"
              icon={<Plus size={14} aria-hidden="true" />}
              onClick={handleOpenCreate}
              className="velica-btn-primary text-xs"
              aria-label="Thêm chủ đề vào Đề cương này"
            >
              Thêm chủ đề vào Đề cương
            </Button>
          </div>
        </section>
      )}

      {/* Search & Filter Toolbar */}
      <FilterBar
        placeholder="Tìm kiếm theo tiêu đề chủ đề hoặc mô tả..."
        onSearchChange={setSearch}
        onClearFilters={() => handleSyllabusFilterChange(undefined)}
        hasActiveFilters={Boolean(selectedSyllabus)}
      >
        <Select
          allowClear
          placeholder="Lọc theo Đề cương môn học"
          className="velica-form-col-fixed-lg"
          value={selectedSyllabus}
          onChange={handleSyllabusFilterChange}
          aria-label="Lọc theo đề cương môn học"
        >
          {syllabi.map((s) => (
            <Select.Option key={s.id} value={s.id}>
              {s.code} - {s.name}
            </Select.Option>
          ))}
        </Select>
      </FilterBar>

      {/* Main Table */}
      <main className="velica-card-table">
        <Table
          dataSource={filteredLessons}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          tableLayout="fixed"
        />
      </main>

      {/* Create / Edit Lesson Drawer Component */}
      <LessonFormDrawer
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        editingLesson={editingLesson}
        syllabi={syllabi}
        defaultSyllabusId={selectedSyllabus}
        defaultOrderIndex={lessons.length + 1}
      />
    </div>
  );
};
