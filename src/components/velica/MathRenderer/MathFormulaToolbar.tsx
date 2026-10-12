import React, { useState } from 'react';
import { Button, Tooltip, Space, Card, Typography, Modal } from 'antd';
import { Binary, HelpCircle, Sparkles, BookOpen } from 'lucide-react';
import { MathRenderer } from './MathRenderer';

const { Text } = Typography;

interface MathFormulaToolbarProps {
  onInsert: (snippet: string) => void;
}

interface MathSnippet {
  label: string;
  tooltip: string;
  latex: string;
  preview: string;
}

const COMMON_SNIPPETS: MathSnippet[] = [
  { label: 'Phân số', tooltip: 'Phân số \\frac{a}{b}', latex: '$\\frac{a}{b}$', preview: '\\frac{a}{b}' },
  { label: 'Căn bậc 2', tooltip: 'Căn bậc hai \\sqrt{x}', latex: '$\\sqrt{x}$', preview: '\\sqrt{x}' },
  { label: 'Căn bậc n', tooltip: 'Căn bậc n \\sqrt[n]{x}', latex: '$\\sqrt[n]{x}$', preview: '\\sqrt[n]{x}' },
  { label: 'Số mũ', tooltip: 'Số mũ x^{2}', latex: '$x^{2}$', preview: 'x^{2}' },
  { label: 'Chỉ số dưới', tooltip: 'Chỉ số dưới x_{i}', latex: '$x_{i}$', preview: 'x_{i}' },
  { label: 'Tổng ∑', tooltip: 'Tổng Sigma \\sum_{i=1}^{n}', latex: '$\\sum_{i=1}^{n} x_i$', preview: '\\sum_{i=1}^{n} x_i' },
  { label: 'Tích phân ∫', tooltip: 'Tích phân xác định \\int_{a}^{b}', latex: '$\\int_{a}^{b} f(x)dx$', preview: '\\int_{a}^{b} f(x)dx' },
  { label: 'Giới hạn lim', tooltip: 'Giới hạn \\lim_{x \\to 0}', latex: '$\\lim_{x \\to 0} f(x)$', preview: '\\lim_{x \\to 0} f(x)' },
  { label: 'Ma trận', tooltip: 'Ma trận 2x2', latex: '$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$', preview: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { label: 'Hệ PT', tooltip: 'Hệ phương trình nhiều dòng', latex: '$$\\begin{cases} 2x + y = 5 \\\\ x - 3y = -1 \\end{cases}$$', preview: '\\begin{cases} 2x + y = 5 \\\\ x - 3y = -1 \\end{cases}' },
  { label: 'Vector', tooltip: 'Vector \\vec{v}', latex: '$\\vec{v}$', preview: '\\vec{v}' },
  { label: '±', tooltip: 'Cộng trừ \\pm', latex: '$\\pm$', preview: '\\pm' },
  { label: '≤ / ≥', tooltip: 'Bé hơn hoặc bằng / Lớn hơn hoặc bằng', latex: '$x \\le y \\quad a \\ge b$', preview: 'x \\le y, a \\ge b' },
  { label: '≠', tooltip: 'Khác nhau \\neq', latex: '$a \\neq b$', preview: 'a \\neq b' },
  { label: '∞', tooltip: 'Vô cực \\infty', latex: '$\\infty$', preview: '\\infty' },
  { label: 'α, β, θ', tooltip: 'Ký tự Hy Lạp \\alpha, \\beta, \\theta, \\pi', latex: '$\\alpha, \\beta, \\theta, \\pi$', preview: '\\alpha, \\beta, \\theta, \\pi' },
  { label: 'Δ (Delta)', tooltip: 'Biệt thức Delta \\Delta = b^2 - 4ac', latex: '$\\Delta = b^2 - 4ac$', preview: '\\Delta = b^2 - 4ac' },
  { label: 'Xác suất P(A)', tooltip: 'Công thức xác suất có điều kiện', latex: '$P(A|B) = \\frac{P(A \\cap B)}{P(B)}$', preview: 'P(A|B) = \\frac{P(A \\cap B)}{P(B)}' },
];

export const MathFormulaToolbar: React.FC<MathFormulaToolbarProps> = ({ onInsert }) => {
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  return (
    <div className="velica-math-toolbar bg-light p-2 rounded-2 border mb-2">
      <div className="d-flex items-center justify-between flex-wrap gap-2 mb-1.5">
        <div className="d-flex items-center gap-1.5">
          <Binary size={14} className="text-brand-color" />
          <Text strong className="text-xs text-primary-color">
            Thư viện Ký hiệu & Công thức Toán học (LaTeX KaTeX):
          </Text>
        </div>
        <Button
          type="link"
          size="small"
          icon={<BookOpen size={13} />}
          onClick={() => setGuideModalOpen(true)}
          className="p-0 text-xs text-brand-color"
        >
          Hướng dẫn cú pháp LaTeX
        </Button>
      </div>

      <div className="d-flex flex-wrap gap-1">
        {COMMON_SNIPPETS.map((snippet, idx) => (
          <Tooltip
            key={idx}
            title={
              <div className="text-center p-1">
                <div className="mb-1">{snippet.tooltip}</div>
                <div className="bg-white text-dark p-1 rounded-1">
                  <MathRenderer math={snippet.preview} displayMode={false} />
                </div>
              </div>
            }
          >
            <Button
              size="small"
              className="text-xs px-2 py-0 h-auto"
              style={{ minHeight: '26px' }}
              onClick={() => onInsert(snippet.latex)}
            >
              {snippet.label}
            </Button>
          </Tooltip>
        ))}
      </div>

      <div className="text-muted-color text-xs mt-1.5 font-sans" style={{ fontSize: '11px' }}>
        * Mẹo: Kẹp công thức giữa dấu <code className="text-brand-color">$...$</code> cho công thức trên cùng dòng, hoặc <code className="text-brand-color">$$...$$</code> để hiển thị căn giữa thành khối riêng.
      </div>

      {/* Guide Modal */}
      <Modal
        title={
          <div className="d-flex items-center gap-2">
            <Sparkles size={18} className="text-brand-color" />
            <span>Cẩm nang Cú pháp Công thức Toán học & Khoa học (KaTeX)</span>
          </div>
        }
        open={guideModalOpen}
        onOk={() => setGuideModalOpen(false)}
        onCancel={() => setGuideModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setGuideModalOpen(false)}>
            Đã hiểu
          </Button>,
        ]}
        width={720}
      >
        <div className="d-flex flex-col gap-3 py-2">
          <Card size="small" title="1. Quy tắc chèn công thức" className="bg-light">
            <ul className="mb-0 pl-3 text-xs d-flex flex-col gap-1.5">
              <li>
                <strong>Công thức nội dòng (Inline):</strong> Đặt giữa cặp dấu <code>$công_thức$</code>. Ví dụ:{' '}
                <code>$f(x) = x^2 + 1$</code> → hiển thị <MathRenderer content="$f(x) = x^2 + 1$" />.
              </li>
              <li>
                <strong>Công thức khối (Display / Block):</strong> Đặt giữa cặp dấu <code>$$công_thức$$</code>. Ví dụ:{' '}
                <code>$$E = mc^2$$</code> → căn giữa nổi bật trên một dòng riêng.
              </li>
            </ul>
          </Card>

          <Card size="small" title="2. Các biểu thức thường dùng trong Đề thi">
            <div className="table-responsive">
              <table className="table table-sm table-bordered text-xs mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Loại biểu thức</th>
                    <th>Cú pháp nhập</th>
                    <th>Kết quả hiển thị</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Phân số</td>
                    <td><code>\frac{'{'}tử{'}'}{'{'}mẫu{'}'}</code></td>
                    <td><MathRenderer math="\frac{a+b}{c-d}" /></td>
                  </tr>
                  <tr>
                    <td>Căn bậc hai, căn bậc n</td>
                    <td><code>\sqrt{'{'}x{'}'}, \sqrt[3]{'{'}8{'}'}</code></td>
                    <td><MathRenderer math="\sqrt{x^2+1}, \sqrt[3]{8} = 2" /></td>
                  </tr>
                  <tr>
                    <td>Số mũ & Chỉ số</td>
                    <td><code>x^{'{'}2{'}'}, a_{'{'}i,j{'}'}</code></td>
                    <td><MathRenderer math="x^2 + y^2 = r^2, a_{i,j}" /></td>
                  </tr>
                  <tr>
                    <td>Tổng & Tích phân</td>
                    <td><code>\sum_{'{'}i=1{'}'}^{'{'}n{'}'} x_i, \int_0^1 x dx</code></td>
                    <td><MathRenderer math="\sum_{i=1}^n x_i, \int_0^1 x dx = \frac{1}{2}" /></td>
                  </tr>
                  <tr>
                    <td>Nghiệm phương trình bậc 2</td>
                    <td><code>x = \frac{'{'}-b \pm \sqrt{'{'}b^2 - 4ac{'}'}{'}'}{'{'}2a{'}'}</code></td>
                    <td><MathRenderer math="x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}" /></td>
                  </tr>
                  <tr>
                    <td>Ký tự Hy Lạp</td>
                    <td><code>\alpha, \beta, \gamma, \Delta, \pi, \lambda, \sigma</code></td>
                    <td><MathRenderer math="\alpha, \beta, \gamma, \Delta, \pi, \lambda, \sigma" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </Modal>
    </div>
  );
};
