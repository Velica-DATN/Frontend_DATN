import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  Button,
  message,
  Typography,
  Tag,
  Divider,
} from 'antd';
import { ShieldAlert, Send, FileCheck2, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import { mockService } from '../../../api/mocks/mockService';
import { Submission, GradeAppeal } from '../../../interfaces/velica.interfaces';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

export interface GradeAppealModalProps {
  open: boolean;
  onClose: () => void;
  preselectedAssessmentId?: string;
  preselectedQuestionId?: string; // Optional/legacy
  onSuccess?: (newAppeal: GradeAppeal) => void;
}

export const GradeAppealModal: React.FC<GradeAppealModalProps> = ({
  open,
  onClose,
  preselectedAssessmentId,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string | undefined>(preselectedAssessmentId);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const loadSubmissions = async () => {
        setLoading(true);
        const allSubs = await mockService.getSubmissions();
        const currentUser = mockService.getCurrentUser();
        const studentSubs = allSubs.filter(
          (s) => s.studentId === currentUser.id || s.studentName === currentUser.fullName || true
        );
        setSubmissions(studentSubs);

        const initialSub = preselectedAssessmentId
          ? studentSubs.find((s) => s.assessmentId === preselectedAssessmentId || s.id === preselectedAssessmentId)
          : studentSubs[0];

        if (initialSub) {
          setSelectedSubId(initialSub.id);
          form.setFieldsValue({
            submissionId: initialSub.id,
            reason: '',
          });
        }
        setLoading(false);
      };

      loadSubmissions();
    } else {
      form.resetFields();
    }
  }, [open, preselectedAssessmentId, form]);

  const activeSubmission = submissions.find((s) => s.id === selectedSubId);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!activeSubmission) return;

      const trimmedReason = values.reason?.trim() || '';
      if (trimmedReason.length < 10) {
        message.error('Vui lòng nêu rõ lý do phúc khảo bài thi (tối thiểu 10 ký tự, không chứa toàn khoảng trắng)!');
        return;
      }

      setSubmitting(true);

      // Business Rule: Check for duplicate pending appeal on the same submission
      const existingAppeals = await mockService.getAppeals();
      const hasPendingAppeal = existingAppeals.some(
        (a) => a.submissionId === activeSubmission.id && a.status === 'PENDING'
      );

      if (hasPendingAppeal) {
        message.error('Bài thi này hiện đã có một đơn phúc khảo đang chờ Giảng viên xử lý! Vui lòng chờ kết quả phản hồi.');
        setSubmitting(false);
        return;
      }

      const currentUser = mockService.getCurrentUser();

      const newAppeal = await mockService.createAppeal({
        submissionId: activeSubmission.id,
        assessmentId: activeSubmission.assessmentId,
        assessmentTitle: activeSubmission.assessmentTitle,
        studentId: currentUser.id,
        studentName: currentUser.fullName,
        currentScore: activeSubmission.score ?? 0,
        maxPoints: activeSubmission.maxScore ?? 10,
        reason: trimmedReason,
      });

      message.success('Đã gửi đơn đề nghị phúc khảo bài thi thành công tới Giảng viên!');
      setSubmitting(false);
      onClose();
      if (onSuccess) {
        onSuccess(newAppeal);
      }
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="d-flex items-center gap-2">
          <ShieldAlert size={18} className="text-brand-color" />
          <span className="font-bold text-base">Gửi Đơn Đề nghị Phúc khảo Bài thi</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      destroyOnClose
      width={580}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy bỏ
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<Send size={14} />}
          loading={submitting}
          onClick={handleSubmit}
          className="velica-btn-primary"
        >
          Nộp đơn phúc khảo
        </Button>,
      ]}
    >
      <div className="py-2">
        <Paragraph className="text-xs text-muted-color mb-3">
          Sinh viên nộp đơn đề nghị phúc khảo để giảng viên xem lại toàn bộ bài làm trong kỳ thi và thực hiện chấm lại điểm số, ghi nhận xét nếu có sai sót.
        </Paragraph>

        <Form form={form} layout="vertical">
          {/* 1. Chọn bài thi cần phúc khảo */}
          <Form.Item
            name="submissionId"
            label={<span className="font-semibold text-xs">Bài thi đề nghị phúc khảo:</span>}
            rules={[{ required: true, message: 'Vui lòng chọn bài thi cần phúc khảo' }]}
          >
            <Select
              placeholder="Chọn bài thi đã hoàn thành..."
              loading={loading}
              onChange={(subId) => {
                setSelectedSubId(subId);
              }}
              options={submissions.map((sub) => ({
                value: sub.id,
                label: (
                  <div className="d-flex items-center justify-between">
                    <span className="font-medium">{sub.assessmentTitle}</span>
                    <span className="text-xs text-muted-color">({sub.score ?? '—'}/{sub.maxScore}đ)</span>
                  </div>
                ),
              }))}
            />
          </Form.Item>

          {/* Exam Info Card */}
          {activeSubmission && (
            <div className="p-3 bg-light border rounded-3 mb-3">
              <div className="d-flex items-center gap-1.5 mb-1.5">
                <FileText size={15} className="text-brand-color" />
                <span className="font-bold text-xs text-primary-color">
                  {activeSubmission.assessmentTitle}
                </span>
              </div>

              <div className="d-flex items-center justify-between pt-2 border-top text-xs flex-wrap gap-2">
                <div>
                  <span className="text-muted-color">Điểm bài thi: </span>
                  <strong className="text-brand-color fs-15">
                    {activeSubmission.score ?? 0} / {activeSubmission.maxScore} đ
                  </strong>
                </div>
                {activeSubmission.submittedAt && (
                  <div className="text-muted-color text-2xs">
                    Nộp bài: {new Date(activeSubmission.submittedAt).toLocaleString('vi-VN')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Nội dung đơn phúc khảo */}
          <Form.Item
            name="reason"
            label={<span className="font-semibold text-xs">Nội dung đơn phúc khảo:</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung đơn phúc khảo' },
              { min: 10, message: 'Nội dung phải từ 10 ký tự trở lên' },
            ]}
          >
            <TextArea
              rows={5}
              placeholder="Nhập nội dung đơn đề nghị phúc khảo bài thi gửi cho giảng viên xem xét và chấm lại..."
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
