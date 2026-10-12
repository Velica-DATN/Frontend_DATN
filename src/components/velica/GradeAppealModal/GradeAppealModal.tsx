import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  InputNumber,
  Button,
  message,
  Typography,
  Tag,
  Divider,
} from 'antd';
import { ShieldAlert, Send, FileCheck2, HelpCircle } from 'lucide-react';
import { mockService } from '../../../api/mocks/mockService';
import { Submission, GradeAppeal } from '../../../interfaces/velica.interfaces';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

export interface GradeAppealModalProps {
  open: boolean;
  onClose: () => void;
  preselectedAssessmentId?: string;
  preselectedQuestionId?: string;
  onSuccess?: (newAppeal: GradeAppeal) => void;
}

export const GradeAppealModal: React.FC<GradeAppealModalProps> = ({
  open,
  onClose,
  preselectedAssessmentId,
  preselectedQuestionId,
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
        // Get submissions for current student or all graded submissions
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
          const initialQId = preselectedQuestionId || initialSub.answers[0]?.questionId;
          const targetAnswer = initialSub.answers.find((a) => a.questionId === initialQId) || initialSub.answers[0];

          form.setFieldsValue({
            submissionId: initialSub.id,
            questionId: targetAnswer?.questionId,
            reason: '',
          });
        }
        setLoading(false);
      };

      loadSubmissions();
    } else {
      form.resetFields();
    }
  }, [open, preselectedAssessmentId, preselectedQuestionId, form]);

  const activeSubmission = submissions.find((s) => s.id === selectedSubId);
  const currentQuestionId = Form.useWatch('questionId', form);
  const activeAnswer = activeSubmission?.answers.find((a) => a.questionId === currentQuestionId);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!activeSubmission) return;

      setSubmitting(true);
      const answer = activeSubmission.answers.find((a) => a.questionId === values.questionId);
      const currentUser = mockService.getCurrentUser();

      const newAppeal = await mockService.createAppeal({
        submissionId: activeSubmission.id,
        assessmentId: activeSubmission.assessmentId,
        assessmentTitle: activeSubmission.assessmentTitle,
        studentId: currentUser.id,
        studentName: currentUser.fullName,
        questionId: values.questionId,
        questionContent: answer?.questionContent || 'Câu hỏi phúc khảo',
        currentScore: answer?.pointsAwarded ?? 0,
        maxPoints: answer?.maxPoints ?? 1,
        reason: values.reason,
      });

      message.success('Đã gửi đơn đề nghị phúc khảo thành công đến Hội đồng chấm thi!');
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
          <span className="font-bold text-base">Gửi Yêu cầu Phúc khảo Điểm Bài thi</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      destroyOnClose
      width={600}
      styles={{
        body: {
          maxHeight: 'calc(80vh - 120px)',
          overflowY: 'auto',
          paddingRight: '6px',
        },
      }}
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
          Sinh viên có quyền đề nghị phúc khảo kết quả thi trắc nghiệm hoặc tự luận nếu phát hiện sai sót trong quá trình chấm điểm hoặc tiêu chí rubric chưa chuẩn xác.
        </Paragraph>

        <Form form={form} layout="vertical">
          {/* 1. Chọn bài thi */}
          <Form.Item
            name="submissionId"
            label={<span className="font-semibold text-xs">Bài thi / Kỳ khảo thí</span>}
            rules={[{ required: true, message: 'Vui lòng chọn bài thi' }]}
          >
            <Select
              placeholder="Chọn bài thi đã hoàn thành..."
              loading={loading}
              onChange={(subId) => {
                setSelectedSubId(subId);
                const sub = submissions.find((s) => s.id === subId);
                if (sub && sub.answers.length > 0) {
                  form.setFieldValue('questionId', sub.answers[0].questionId);
                }
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

          {/* 2. Chọn câu hỏi */}
          {activeSubmission && (
            <Form.Item
              name="questionId"
              label={<span className="font-semibold text-xs">Câu hỏi đề nghị phúc khảo</span>}
              rules={[{ required: true, message: 'Vui lòng chọn câu hỏi' }]}
            >
              <Select
                placeholder="Chọn câu hỏi..."
                options={activeSubmission.answers.map((ans, idx) => ({
                  value: ans.questionId,
                  label: (
                    <div className="d-flex items-center justify-between">
                      <span>Câu #{idx + 1} ({ans.questionType})</span>
                      <span className="font-semibold text-xs text-brand-color">
                        {ans.pointsAwarded ?? 'Chờ chấm'} / {ans.maxPoints}đ
                      </span>
                    </div>
                  ),
                }))}
              />
            </Form.Item>
          )}

          {/* Question Summary Box */}
          {activeAnswer && (
            <div className="p-3 bg-light border rounded-2 mb-3">
              <div className="d-flex justify-between items-center mb-1">
                <span className="text-2xs uppercase tracking-wider font-bold text-muted-color">
                  Nội dung câu hỏi được chọn:
                </span>
                <Tag color={activeAnswer.questionType === 'ESSAY' ? 'purple' : 'blue'} className="m-0 text-2xs">
                  {activeAnswer.questionType}
                </Tag>
              </div>
              <div className="text-xs font-medium text-primary-color mb-2">
                {activeAnswer.questionContent || 'Câu hỏi khảo thí chuẩn đầu ra'}
              </div>
              <div className="d-flex items-center gap-3 text-xs">
                <span>
                  Điểm hiện tại: <strong>{activeAnswer.pointsAwarded ?? 0}đ</strong>
                </span>
                <span>
                  Điểm tối đa: <strong>{activeAnswer.maxPoints}đ</strong>
                </span>
              </div>
            </div>
          )}

          {/* 3. Lý do & Giải trình */}
          <Form.Item
            name="reason"
            label={<span className="font-semibold text-xs">Lý do & Căn cứ giải trình học thuật</span>}
            rules={[
              { required: true, message: 'Vui lòng nêu rõ lý do đề nghị phúc khảo' },
              { min: 15, message: 'Nội dung giải trình phải từ 15 ký tự trở lên' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Vd: Thưa thầy/cô, trong phần trả lời câu hỏi tự luận này, em đã trình bày đầy đủ sơ đồ tách Domain và Infrastructure theo đúng giáo trình Bài 3 và tiêu chí Rubric mức Tốt. Kính mong thầy/cô xem xét lại giúp em ạ..."
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
