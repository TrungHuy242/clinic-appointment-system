import React from "react";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle,
  Clock,
  Heart,
  MapPin,
  Phone,
  Shield,
  Star,
  Stethoscope,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const DOCTORS = [
  {
    name: "BS. Nguyễn Thị Hương",
    specialty: "Nhi khoa",
    experience: "12 năm kinh nghiệm",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=400&fit=crop&q=80",
  },
  {
    name: "BS. Trần Văn Minh",
    specialty: "Tim mạch",
    experience: "15 năm kinh nghiệm",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=400&fit=crop&q=80",
  },
  {
    name: "BS. Lê Thị Lan",
    specialty: "Da liễu",
    experience: "10 năm kinh nghiệm",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&h=400&fit=crop&q=80",
  },
  {
    name: "BS. Phạm Ngọc Khoa",
    specialty: "Tai mũi họng",
    experience: "8 năm kinh nghiệm",
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=400&fit=crop&q=80",
  },
];

const SERVICES = [
  { icon: Heart, name: "Tim mạch", slug: "tim-mach" },
  { icon: Stethoscope, name: "Tai mũi họng", slug: "tai-mui-hong" },
  { icon: User, name: "Nhi khoa", slug: "nhi-khoa" },
  { icon: Shield, name: "Da liễu", slug: "da-lieu" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero Section with Background Image */}
      <section className="landing-hero-simple">
        <div className="landing-hero-bg">
          <img
            src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&h=800&fit=crop&q=80"
            alt="MediCare Clinic"
            className="landing-hero-img"
          />
          <div className="landing-hero-overlay"></div>
        </div>
        
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            Chăm sóc sức khỏe<br />
            <span>tận tâm</span>
          </h1>
          <p className="landing-hero-sub">
            Đặt lịch khám nhanh chóng - An tâm về chất lượng
          </p>
          
          <button className="landing-cta-btn" onClick={() => navigate("/book")}>
            <CalendarCheck className="mc-icon" />
            Đặt lịch khám ngay
          </button>
          
          <div className="landing-hero-stats">
            <div className="landing-stat">
              <Star className="landing-stat-icon" />
              <span>4.9/5 đánh giá</span>
            </div>
            <div className="landing-stat">
              <User className="landing-stat-icon" />
              <span>30+ bác sĩ</span>
            </div>
            <div className="landing-stat">
              <Clock className="landing-stat-icon" />
              <span>Đặt lịch 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="landing-services" id="services">
        <div className="landing-services-header">
          <h2>Dịch vụ khám bệnh</h2>
          <p>Chọn chuyên khoa phù hợp với nhu cầu của bạn</p>
        </div>
        
        <div className="landing-services-grid">
          {SERVICES.map((service) => (
            <button
              key={service.slug}
              className="landing-service-card"
              onClick={() => navigate("/book")}
            >
              <div className="landing-service-icon">
                <service.icon className="mc-icon" />
              </div>
              <span>{service.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Doctors Section */}
      <section className="landing-doctors" id="team">
        <div className="landing-doctors-header">
          <h2>Đội ngũ bác sĩ</h2>
          <p>Tận tâm - Tận tình - Tận lực</p>
        </div>
        
        <div className="landing-doctors-grid">
          {DOCTORS.map((doctor) => (
            <div key={doctor.name} className="landing-doctor-card">
              <div className="landing-doctor-img">
                <img src={doctor.image} alt={doctor.name} />
              </div>
              <div className="landing-doctor-info">
                <h3>{doctor.name}</h3>
                <p>{doctor.specialty}</p>
                <span>{doctor.experience}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="landing-why">
        <div className="landing-why-header">
          <h2>Tại sao chọn MediCare?</h2>
        </div>
        
        <div className="landing-why-grid">
          <div className="landing-why-item">
            <CheckCircle className="landing-why-icon" />
            <h3>Đặt lịch nhanh</h3>
            <p>Chỉ vài click - Không cần gọi điện</p>
          </div>
          <div className="landing-why-item">
            <Clock className="landing-why-icon" />
            <h3>Chọn giờ linh hoạt</h3>
            <p>Xem lịch trống thực tế, đặt ngay</p>
          </div>
          <div className="landing-why-item">
            <Shield className="landing-why-icon" />
            <h3>Chuyên nghiệp</h3>
            <p>Đội ngũ bác sĩ giàu kinh nghiệm</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="landing-contact" id="contact">
        <div className="landing-contact-card">
          <h2>Liên hệ với chúng tôi</h2>
          
          <div className="landing-contact-info">
            <div className="landing-contact-item">
              <MapPin className="mc-icon" />
              <div>
                <strong>Địa chỉ</strong>
                <span>123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng</span>
              </div>
            </div>
            
            <div className="landing-contact-item">
              <Phone className="mc-icon" />
              <div>
                <strong>Hotline</strong>
                <span>1900 1234</span>
              </div>
            </div>
            
            <div className="landing-contact-item">
              <Clock className="mc-icon" />
              <div>
                <strong>Giờ làm việc</strong>
                <span>08:00 - 11:30 · 13:30 - 17:00</span>
              </div>
            </div>
          </div>
          
          <button className="landing-cta-btn landing-cta-btn--secondary" onClick={() => navigate("/book")}>
            Đặt lịch ngay
            <ArrowRight className="mc-icon" />
          </button>
        </div>
      </section>
    </div>
  );
}
