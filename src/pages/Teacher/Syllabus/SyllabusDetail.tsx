import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Syllabus } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { SyllabusView } from '../../../components/velica/SyllabusView/SyllabusView';

export const SyllabusDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const syl = await mockService.getSyllabusById(id || 'syl-1');
      setSyllabus(syl);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  return (
    <div className="animate-fade-in">
      <div className="velica-back-nav-bar d-flex justify-between items-center mb-3">
        <Button
          type="text"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate(ROUTE_PATHS.TEACHER.SYLLABUS)}
          className="velica-back-btn"
        >
          Quay lại danh mục đề cương
        </Button>

        {syllabus && (
          <Button
            type="primary"
            onClick={() =>
              navigate(
                ROUTE_PATHS.TEACHER.SYLLABUS_EDIT.replace(':id', syllabus.id)
              )
            }
            className="velica-btn-primary text-xs"
          >
            Chỉnh sửa Đề cương (Toàn màn hình) ↗
          </Button>
        )}
      </div>

      <SyllabusView
        syllabus={syllabus}
        editable={true}
        onSyllabusUpdated={(updated) => setSyllabus(updated)}
      />
    </div>
  );
};
