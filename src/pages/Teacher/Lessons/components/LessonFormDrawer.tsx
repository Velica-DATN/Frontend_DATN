import React, { useEffect, useMemo } from 'react';
import { Drawer, Form, Input, Select, InputNumber, Button, Space } from 'antd';
import { Lesson, Syllabus } from '../../../../interfaces/velica.interfaces';

export interface LessonFormValues {
  title: string;
  description: string;
  content?: string;
  orderIndex: number;
  syllabusId: string;
  cloIds: string[];
}

interface LessonFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: LessonFormValues) => Promise<void>;
  editingLesson: Lesson | null;
  syllabi: Syllabus[];
  defaultSyllabusId?: string;
  defaultOrderIndex: number;
}

const DEFAULT_CLOS = [
  { label: 'CLO1: Hiểu & phân tích kiến trúc phần mềm', value: 'CLO1' },
  { label: 'CLO2: Thiết kế hệ thống phân tán & Microservices', value: 'CLO2' },
  { label: 'CLO3: Đánh giá Trade-offs & Cloud Native', value: 'CLO3' },
  { label: 'CLO4: Triển khai & Kiểm thử thực chiến', value: 'CLO4' },
];

export const LessonFormDrawer: React.FC<LessonFormDrawerProps> = ({
  open,
  onClose,
  onSubmit,
  editingLesson,
  syllabi,
  defaultSyllabusId,
  defaultOrderIndex,
}) => {
  const [form] = Form.useForm<LessonFormValues>();
  const watchedSyllabusId = Form.useWatch('syllabusId', form);

  // Sync form values when drawer opens or editingLesson changes
  useEffect(() => {
    if (open) {
      if (editingLesson) {
        form.setFieldsValue({
          syllabusId: editingLesson.syllabusId,
          title: editingLesson.title,
          description: editingLesson.description,
          orderIndex: editingLesson.orderIndex,
          cloIds: editingLesson.cloIds && editingLesson.cloIds.length > 0 ? editingLesson.cloIds : ['CLO1'],
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          orderIndex: defaultOrderIndex,
          syllabusId: defaultSyllabusId || syllabi[0]?.id,
          cloIds: ['CLO1'],
        });
      }
    }
  }, [open, editingLesson, defaultOrderIndex, defaultSyllabusId, syllabi, form]);

  // Compute CLO options based on currently selected syllabus
  const cloOptions = useMemo(() => {
    const currentSyl = syllabi.find(
      (s) => s.id === (watchedSyllabusId || defaultSyllabusId || syllabi[0]?.id)
    );
    if (currentSyl?.learningObjectives && currentSyl.learningObjectives.length > 0) {
      return currentSyl.learningObjectives.map((clo) => ({
        label: `${clo.code}: ${clo.description}`,
        value: clo.code,
      }));
    }
    return DEFAULT_CLOS;
  }, [syllabi, watchedSyllabusId, defaultSyllabusId]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch {
      // validation error caught by AntD form
    }
  };

  return (
    <Drawer
      title={
        <div>
          <h2 className="velica-drawer-title fs-16 m-0">
            {editingLesson ? 'Chỉnh sửa Chủ đề Đề cương' : 'Tạo Chủ đề mới cho Đề cương'}
          </h2>
          <p className="velica-drawer-subtitle m-0 text-xs text-muted-color">
            Thiết lập chủ đề bài giảng thuộc đề cương môn học, gắn chuẩn CLO tương ứng và quản lý khảo thí.
          </p>
        </div>
      }
      open={open}
      onClose={onClose}
      width={580}
      extra={
        <Space>
          <Button onClick={onClose} aria-label="Hủy chỉnh sửa">
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            className="velica-btn-primary"
            aria-label={editingLesson ? 'Lưu thay đổi chủ đề' : 'Thêm chủ đề mới'}
          >
            {editingLesson ? 'Lưu thay đổi' : 'Thêm chủ đề'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" className="velica-drawer-form">
        <Form.Item
          name="syllabusId"
          label="Đề cương môn học (Syllabus)"
          rules={[{ required: true, message: 'Vui lòng chọn đề cương môn học' }]}
        >
          <Select
            placeholder="Chọn đề cương môn học..."
            disabled={Boolean(editingLesson)}
            showSearch
            optionFilterProp="children"
            aria-label="Chọn đề cương môn học"
          >
            {syllabi.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <div className="velica-form-row">
          <Form.Item
            name="orderIndex"
            label="Thứ tự bài học"
            rules={[{ required: true, message: 'Nhập thứ tự bài' }]}
            style={{ width: 140 }}
          >
            <InputNumber
              min={1}
              max={99}
              className="w-100"
              placeholder="VD: 1"
              aria-label="Thứ tự bài học"
            />
          </Form.Item>

          <Form.Item
            name="title"
            label="Tên chủ đề / Bài giảng"
            rules={[{ required: true, message: 'Vui lòng nhập tên chủ đề' }]}
            className="velica-form-col-flex"
          >
            <Input
              placeholder="VD: Bài 1: Nguyên lý SOLID & Clean Architecture"
              aria-label="Tên chủ đề"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="cloIds"
          label="Chuẩn đầu ra môn học ánh xạ (CLO Mapping)"
          rules={[{ required: true, message: 'Vui lòng chọn ít nhất một chuẩn CLO' }]}
          tooltip="Mỗi chủ đề cần ánh xạ với ít nhất 1 Chuẩn đầu ra (CLO) trong đề cương để đo lường kết quả học tập"
        >
          <Select
            mode="multiple"
            placeholder="Chọn các chuẩn CLO liên quan..."
            options={cloOptions}
            aria-label="Chọn chuẩn đầu ra CLO"
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả phạm vi kiến thức & kỹ năng trọng tâm"
          rules={[{ required: true, message: 'Vui lòng nhập mô tả nội dung chủ đề' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Mô tả chi tiết nội dung kiến thức, công nghệ tiếp cận và mục tiêu đánh giá sinh viên..."
            aria-label="Mô tả chủ đề"
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
