import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Tag, Space, Drawer, List, Divider, Modal, Input, message } from 'antd';
import { BookOpen, User, GraduationCap, PlusCircle, KeyRound, FileCheck2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { ClassRoom, Syllabus } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';

const { Title, Text, Paragraph } = Typography;

export const StudentClasses: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);
  const [sylDrawerOpen, setSylDrawerOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [enrollCode, setEnrollCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [clsList, sylList] = await Promise.all([
        mockService.getClasses(),
        mockService.getSyllabi(),
      ]);
      setClasses(clsList);
      setSyllabi(sylList);
    };
    fetchData();
  }, []);

  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);

  const handleViewClassDetails = (cls: ClassRoom) => {
    setSelectedClass(cls);
    const foundSyl = syllabi.find((s) => s.id === cls.syllabusId) || syllabi[0];
    setSelectedSyllabus(foundSyl);
    setSylDrawerOpen(true);
  };

  const handleJoinClass = async () => {
    if (!enrollCode.trim()) {
      message.error('Vui lòng nhập mã lớp học phần / Enrollment Key');
      return;
    }
    setIsJoining(true);
    // Simulate lookup and enrollment
    const codeUpper = enrollCode.trim().toUpperCase();
    const existing = classes.find(c => c.code.toUpperCase() === codeUpper);
    if (existing) {
      message.warning(`Bạn đã tham gia lớp học "${existing.name}" rồi.`);
      setIsJoining(false);
      return;
    }

    const newJoinedClass: ClassRoom = {
      id: `cls-join-${Date.now()}`,
      code: codeUpper,
      name: `Học Phần ${codeUpper} (Đã tham gia bằng mã)`,
      description: 'Lớp học phần vừa được ghi danh thành công thông qua mã lớp.',
      term: 'HK1 - 2026-2027',
      teacherId: 'user-teacher-1',
      teacherName: 'TS. Nguyễn Văn An',
      syllabusId: 'syl-1',
      syllabusName: 'Kiến Trúc & Thiết Kế Phần Mềm',
      memberCount: 41,
      assessmentCount: 2,
      createdAt: new Date().toISOString(),
    };

    setClasses(prev => [newJoinedClass, ...prev]);
    setIsJoining(false);
    setJoinModalOpen(false);
    setEnrollCode('');
    message.success(`Đã tham gia lớp học "${newJoinedClass.name}" thành công!`);
  };

  return (
    <div className="animate-fade-in">
      <div className="velica-page-header">
        <div>
          <Title level={4} className="velica-page-title">
            Lớp học phần của Tôi
          </Title>
          <Text type="secondary" className="velica-page-desc">
            Các học phần đang theo học trong học kỳ hiện tại, xem đề cương chi tiết và chuẩn đầu ra.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusCircle size={16} />}
          onClick={() => setJoinModalOpen(true)}
          className="velica-btn-primary"
        >
          Tham gia lớp bằng mã
        </Button>
      </div>

      <Row gutter={[20, 20]}>
        {classes.map((cls) => (
          <Col xs={24} sm={12} lg={8} key={cls.id}>
            <Card
              bordered
              className="velica-course-card p-4 justify-between"
            >
              <div>
                <div className="d-flex items-center justify-between mb-2">
                  <Tag color="blue" className="rounded-2 font-semibold">
                    {cls.code}
                  </Tag>
                </div>

                <Title level={5} className="velica-course-name">
                  {cls.name}
                </Title>

                <Paragraph type="secondary" className="velica-cell-desc mb-3">
                  {cls.description}
                </Paragraph>

                <div className="d-flex flex-col gap-2 text-sm text-secondary-color">
                  <div className="d-flex items-center gap-2">
                    <User size={15} className="text-brand-color" /> Giảng viên: <Text strong className="text-primary-color">{cls.teacherName}</Text>
                  </div>
                  <div className="d-flex items-center gap-2">
                    <BookOpen size={15} className="text-brand-color" /> Đề cương: <span className="text-secondary-color">{cls.syllabusName}</span>
                  </div>
                </div>
              </div>

              <div className="velica-course-actions-footer mt-4">
                <Button
                  type="primary"
                  size="small"
                  onClick={() => navigate(ROUTE_PATHS.STUDENT.CLASS_DETAIL.replace(':id', cls.id))}
                  className="velica-btn-primary"
                >
                  Vào lớp học &rarr;
                </Button>

                <Button
                  type="text"
                  icon={<FileCheck2 size={14} />}
                  onClick={() => navigate(`${ROUTE_PATHS.STUDENT.CLASS_DETAIL.replace(':id', cls.id)}?tab=assessments`)}
                  className="text-brand-color p-0 font-medium"
                >
                  Bài kiểm tra
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Class & Syllabus Drawer for Student (#8 View Class) */}
      <Drawer
        title={
          <div>
            <div className="velica-drawer-title">
              {selectedClass ? `${selectedClass.name} (${selectedClass.code})` : 'Thông tin lớp học'}
            </div>
            <div className="velica-drawer-subtitle">
              Giảng viên: {selectedClass?.teacherName}
            </div>
          </div>
        }
        open={sylDrawerOpen}
        onClose={() => setSylDrawerOpen(false)}
        width={560}
        extra={
          <Button onClick={() => setSylDrawerOpen(false)}>
            Đóng
          </Button>
        }
      >
        <div>
          <div className="velica-clo-card mb-3">
            <Text strong className="d-block mb-1 text-brand-color text-base">
              Học phần: {selectedSyllabus?.name}
            </Text>
            <Paragraph type="secondary" className="m-0 velica-page-desc">
              {selectedClass?.description || selectedSyllabus?.description}
            </Paragraph>
          </div>

          <Divider className="my-3" />

          <Text strong className="d-block mb-2 text-sm text-primary-color">
            Chuẩn đầu ra môn học (CLO):
          </Text>
          <List
            size="small"
            dataSource={selectedSyllabus?.learningObjectives || []}
            renderItem={(item) => (
              <List.Item className="py-2">
                <Tag color="blue" className="rounded-2 font-medium">{item.code}</Tag>
                <span className="text-secondary-color">{item.description}</span>
              </List.Item>
            )}
          />

          <Divider className="my-3" />

          <div className="text-end">
            <Button
              type="primary"
              onClick={() => {
                setSylDrawerOpen(false);
                navigate(ROUTE_PATHS.STUDENT.ASSESSMENTS);
              }}
              className="velica-btn-primary"
            >
              Xem danh sách bài kiểm tra của học phần →
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Drawer Join Class via Code (#UC-CLS-03) - Unified side sheet */}
      <Drawer
        title={
          <div className="d-flex items-center gap-2">
            <KeyRound size={18} className="text-brand-color" />
            <span>Ghi danh Lớp học phần</span>
          </div>
        }
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        width={440}
        extra={
          <Space>
            <Button onClick={() => setJoinModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="primary"
              loading={isJoining}
              onClick={handleJoinClass}
              className="velica-btn-primary"
            >
              Xác nhận
            </Button>
          </Space>
        }
      >
        <div className="py-2">
          <Paragraph type="secondary">
            Nhập <strong>Mã lớp học phần</strong> (Enrollment Key) do Giảng viên cung cấp (ví dụ: <code>CS204.P02</code>, <code>SE301.P01</code>, <code>IT205.P03</code>) để truy cập đề cương và làm bài thi:
          </Paragraph>
          <Input
            placeholder="Vd: CS204.P02"
            value={enrollCode}
            onChange={(e) => setEnrollCode(e.target.value)}
            onPressEnter={handleJoinClass}
            size="large"
            prefix={<KeyRound size={16} className="text-muted-color" />}
          />
        </div>
      </Drawer>
    </div>
  );
};
