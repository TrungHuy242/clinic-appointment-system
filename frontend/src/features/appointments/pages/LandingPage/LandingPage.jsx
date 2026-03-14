import React from "react";
import {
  ArrowRight,
  Baby,
  Brain,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  MapPin,
  PhoneCall,
  ScanLine,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const SPECIALTIES = [
  {
    icon: Baby,
    name: "Nhi khoa",
    slug: "nhi-khoa",
    summary: "Khám nhanh cho trẻ nhỏ, ưu tiên phụ huynh cần lịch trong ngày.",
  },
  {
    icon: Sparkles,
    name: "Da liễu",
    slug: "da-lieu",
    summary: "Theo dõi tình trạng da, tái khám định kỳ và lên phác đồ rõ ràng.",
  },
  {
    icon: Stethoscope,
    name: "Tai Mũi Họng",
    slug: "tai-mui-hong",
    summary: "Lọc triệu chứng nhanh để người dùng không cần gọi điện hỏi trước.",
  },
  {
    icon: Smile,
    name: "Nha khoa",
    slug: "nha-khoa",
    summary: "Đặt theo khung giờ ổn định, phù hợp khách đi làm và gia đình.",
  },
  {
    icon: HeartPulse,
    name: "Tim mạch",
    slug: "tim-mach",
    summary: "Ưu tiên ca tái khám và các lần cần theo dõi sát chỉ số.",
  },
  {
    icon: Brain,
    name: "Thần kinh",
    slug: "than-kinh",
    summary: "Luồng đặt lịch rõ từng bước cho các ca cần mô tả triệu chứng kỹ hơn.",
  },
];

const OBSERVATION_CARDS = [
  {
    icon: CalendarDays,
    title: "Khung giờ nhìn được ngay",
    value: "Theo ngày thực",
    description: "Người dùng thấy trực tiếp các khoảng còn trống thay vì phải chờ xác nhận thủ công.",
  },
  {
    icon: ShieldCheck,
    title: "Mã lịch hẹn rõ ràng",
    value: "APT-YYYY-XXXX",
    description: "Mỗi lịch đều có mã thống nhất để tra cứu, hỗ trợ và check-in nhanh tại quầy.",
  },
  {
    icon: ScanLine,
    title: "Check-in có cửa sổ",
    value: "-15 / +10 phút",
    description: "Quy tắc check-in minh bạch giúp giảm ùn quầy và hạn chế sai sót vận hành.",
  },
  {
    icon: CheckCircle2,
    title: "Xác nhận PA1 tức thì",
    value: "Giữ lịch trong 15 phút",
    description: "Luồng sau đặt lịch được dẫn thẳng tới xác nhận để tránh rớt khung giờ đã chọn.",
  },
];

const USER_PERSPECTIVES = [
  {
    icon: Clock3,
    title: "Người đi làm bận rộn",
    description: "Muốn quyết định nhanh, không phải gọi điện và không bị lạc trong quá nhiều bước phụ.",
  },
  {
    icon: Users,
    title: "Phụ huynh có con nhỏ",
    description: "Cần một trang đủ rõ để nhìn giờ trống, bác sĩ phù hợp và xử lý nhanh nếu cần đổi lịch.",
  },
  {
    icon: UserRound,
    title: "Khách tái khám",
    description: "Quan tâm tới việc tra lại lịch cũ, xác nhận nhanh và đến quầy với quy trình quen thuộc.",
  },
  {
    icon: PhoneCall,
    title: "Người cần hỗ trợ trực tiếp",
    description: "Vẫn luôn thấy hotline, địa chỉ và bước tiếp theo rõ ràng khi có trục trặc hoặc cần hướng dẫn.",
  },
];

const FLOW_STEPS = [
  {
    step: "01",
    title: "Chọn đúng chuyên khoa",
    description: "Không ép người dùng hiểu nội bộ phòng khám trước. Trang chủ đưa ra nhóm dịch vụ đủ gần với nhu cầu thực tế.",
  },
  {
    step: "02",
    title: "Chốt bác sĩ và khung giờ",
    description: "Từ lúc xem lịch đến lúc đặt chỉ là một mạch liền, không cần nhảy qua nhiều màn rời rạc.",
  },
  {
    step: "03",
    title: "Xác nhận PA1 để giữ chỗ",
    description: "Người dùng luôn biết tình trạng lịch của mình thay vì rơi vào trạng thái chờ mơ hồ.",
  },
  {
    step: "04",
    title: "Tra cứu và check-in gọn",
    description: "Mã lịch hẹn và số điện thoại là hai điểm chạm đủ mạnh để xử lý gần như toàn bộ hành trình tại quầy.",
  },
];

const CONTACT_POINTS = [
  {
    icon: PhoneCall,
    label: "Hotline đặt lịch",
    value: "1900 1234",
    meta: "Hỗ trợ xuyên suốt giờ làm việc của cơ sở",
  },
  {
    icon: MapPin,
    label: "Địa chỉ phòng khám",
    value: "123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng",
    meta: "Có hướng dẫn check-in và hỗ trợ tại quầy lễ tân",
  },
  {
    icon: Building2,
    label: "Cơ sở vận hành",
    value: "MediCare Clinic Hải Châu",
    meta: "Quy trình booking, lookup, reception và doctor đã được nối hệ thống",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero__content">
          <div className="landing-hero__badge">
            <ShieldCheck className="mc-icon mc-icon--sm" />
            MediCare Hải Châu · landing page định hướng sản phẩm thật
          </div>

          <h1 className="landing-hero__title">
            Đặt lịch khám đủ nhanh để dùng ngay,
            <br />
            <span className="landing-hero__title-accent">đủ rõ để người dùng yên tâm từ lần chạm đầu tiên</span>
          </h1>

          <p className="landing-hero__sub">
            Đây không chỉ là trang giới thiệu. Đây là một điểm vào có nhiệm vụ dẫn người dùng đi từ nhu cầu,
            đến quyết định, tới xác nhận lịch hẹn và cuối cùng là check-in mà không bị rối.
          </p>

          <div className="landing-hero__actions">
            <button className="landing-btn-primary" onClick={() => navigate("/book")}>
              Đặt lịch khám ngay
              <ArrowRight className="mc-icon mc-icon--sm" />
            </button>
            <button className="landing-btn-outline" onClick={() => navigate("/lookup")}>
              Tra cứu lịch hẹn
            </button>
          </div>

          <div className="landing-hero__proofs">
            <div className="landing-hero__proof-chip">Chuyên khoa dễ hiểu</div>
            <div className="landing-hero__proof-chip">Giữ lịch minh bạch</div>
            <div className="landing-hero__proof-chip">Check-in một luồng</div>
          </div>

          <div className="landing-hero__stats">
            <div className="landing-hero__stat-card">
              <span className="landing-hero__stat-value">24/7</span>
              <span className="landing-hero__stat-label">Đặt lịch trực tuyến không phụ thuộc tổng đài</span>
            </div>
            <div className="landing-hero__stat-card">
              <span className="landing-hero__stat-value">30+</span>
              <span className="landing-hero__stat-label">Bác sĩ và chuyên khoa đang mở lịch theo ngày</span>
            </div>
            <div className="landing-hero__stat-card">
              <span className="landing-hero__stat-value">15'</span>
              <span className="landing-hero__stat-label">Khoảng giữ chỗ rõ ràng để xác nhận PA1</span>
            </div>
            <div className="landing-hero__stat-card">
              <span className="landing-hero__stat-value">4.9</span>
              <span className="landing-hero__stat-label">Mức hài lòng giả lập cho trải nghiệm tiếp cận dễ dùng</span>
            </div>
          </div>
        </div>

        <div className="landing-hero__visual">
          <div className="landing-command-board">
            <div className="landing-command-board__top">
              <div className="landing-command-board__facility">
                <div className="landing-command-board__facility-icon">
                  <Building2 className="mc-icon mc-icon--lg" />
                </div>
                <div>
                  <div className="landing-command-board__eyebrow">Cơ sở đang phục vụ</div>
                  <div className="landing-command-board__title">MediCare Clinic Hải Châu</div>
                </div>
              </div>
              <div className="landing-command-board__badge">
                <MapPin className="mc-icon mc-icon--sm" />
                123 Nguyễn Văn Linh, Đà Nẵng
              </div>
            </div>

            <div className="landing-command-board__grid">
              <article className="landing-panel landing-panel--primary">
                <div className="landing-panel__label">Điểm vào nhanh</div>
                <div className="landing-panel__headline">Từ landing page tới xác nhận PA1 trong một mạch liền</div>
                <div className="landing-panel__route">
                  <span>Chọn chuyên khoa</span>
                  <ArrowRight className="mc-icon mc-icon--xs" />
                  <span>Chọn bác sĩ</span>
                  <ArrowRight className="mc-icon mc-icon--xs" />
                  <span>Xác nhận lịch</span>
                </div>
              </article>

              <article className="landing-panel landing-panel--schedule">
                <div className="landing-panel__header-row">
                  <div className="landing-panel__label">Khung giờ hôm nay</div>
                  <div className="landing-panel__live">Live</div>
                </div>
                <div className="landing-slot-list">
                  <div className="landing-slot-list__row">
                    <span>08:50</span>
                    <span>Da liễu</span>
                    <span className="landing-slot-state landing-slot-state--busy">Đã đặt</span>
                  </div>
                  <div className="landing-slot-list__row">
                    <span>09:15</span>
                    <span>Tim mạch</span>
                    <span className="landing-slot-state landing-slot-state--open">Còn trống</span>
                  </div>
                  <div className="landing-slot-list__row">
                    <span>10:05</span>
                    <span>Nhi khoa</span>
                    <span className="landing-slot-state landing-slot-state--hold">Giữ 15'</span>
                  </div>
                </div>
              </article>

              <article className="landing-panel landing-panel--support">
                <div className="landing-panel__label">Hỗ trợ và tra cứu</div>
                <div className="landing-support-card__line">
                  <PhoneCall className="mc-icon mc-icon--sm" />
                  1900 1234 · hỗ trợ điều hướng tại quầy
                </div>
                <div className="landing-support-card__line">
                  <ScanLine className="mc-icon mc-icon--sm" />
                  Check-in trong cửa sổ -15 / +10 phút
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-observation">
        <div className="landing-section__header landing-section__header--compact">
          <div className="landing-step-num">01</div>
          <div>
            <h2 className="landing-section__title">Những gì người dùng quan sát được ngay</h2>
            <p className="landing-section__sub">
              Một landing page tốt không chỉ đẹp. Nó phải cho người dùng thấy cấu trúc dịch vụ, độ tin cậy và bước tiếp theo chỉ trong vài giây đầu.
            </p>
          </div>
        </div>

        <div className="landing-observation__grid">
          {OBSERVATION_CARDS.map((item) => (
            <article key={item.title} className="landing-observation-card">
              <div className="landing-observation-card__icon">
                <item.icon className="mc-icon mc-icon--md" />
              </div>
              <div className="landing-observation-card__value">{item.value}</div>
              <h3 className="landing-observation-card__title">{item.title}</h3>
              <p className="landing-observation-card__copy">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="services">
        <div className="landing-section__header">
          <div className="landing-step-num">02</div>
          <div>
            <h2 className="landing-section__title">Chọn chuyên khoa bằng ngôn ngữ gần với nhu cầu</h2>
            <p className="landing-section__sub">
              Thay vì để người dùng tự đoán quy trình, trang chủ gợi ngay các nhóm khám phổ biến để ra quyết định nhanh hơn.
            </p>
          </div>
        </div>

        <div className="landing-specialty-grid">
          {SPECIALTIES.map((specialty) => (
            <button
              key={specialty.name}
              className={`landing-specialty-card landing-specialty-card--${specialty.slug}`}
              onClick={() => navigate("/book")}
            >
              <span className="landing-specialty-icon">
                <specialty.icon className="mc-icon landing-specialty-icon__svg" />
              </span>
              <span className="landing-specialty-name">{specialty.name}</span>
              <span className="landing-specialty-summary">{specialty.summary}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="landing-section" id="team">
        <div className="landing-section__header">
          <div className="landing-step-num">03</div>
          <div>
            <h2 className="landing-section__title">Nhìn từ nhiều góc sử dụng khác nhau</h2>
            <p className="landing-section__sub">
              Cùng một hệ thống, nhưng mỗi người dùng bước vào với một áp lực khác nhau. Landing page cần nói được với từng kiểu nhu cầu đó.
            </p>
          </div>
        </div>

        <div className="landing-perspective-layout">
          <div className="landing-doctor-card landing-doctor-card--feature">
            <div className="landing-doctor-card__tag">Spotlight bác sĩ</div>
            <div className="landing-doctor-top">
              <div className="landing-doctor-avatar">NA</div>
              <div className="landing-doctor-info">
                <div className="landing-doctor-name">BS. Nguyễn Văn A</div>
                <div className="landing-doctor-specialty">Da liễu · Cơ sở Hải Châu</div>
                <div className="landing-doctor-rating">
                  <Star className="mc-icon mc-icon--sm" fill="currentColor" />
                  4.8 · 8 năm kinh nghiệm
                </div>
              </div>
            </div>
            <div className="landing-slot-grid">
              {["08:00", "08:50", "09:15", "09:40", "10:05"].map((time, index) => (
                <button
                  key={time}
                  className={`landing-slot ${index === 2 ? "landing-slot--selected" : ""} ${index === 3 ? "landing-slot--booked" : ""}`}
                >
                  {time}
                </button>
              ))}
            </div>
            <button className="landing-book-btn" onClick={() => navigate("/book")}>
              Xem lịch và đặt với bác sĩ này
              <ArrowRight className="mc-icon mc-icon--sm" />
            </button>
          </div>

          <div className="landing-perspective-grid">
            {USER_PERSPECTIVES.map((item) => (
              <article key={item.title} className="landing-perspective-card">
                <div className="landing-perspective-card__icon">
                  <item.icon className="mc-icon mc-icon--md" />
                </div>
                <h3 className="landing-perspective-card__title">{item.title}</h3>
                <p className="landing-perspective-card__copy">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--flow">
        <div className="landing-section__header">
          <div className="landing-step-num">04</div>
          <div>
            <h2 className="landing-section__title">Hành trình một chạm nhưng vẫn đủ kiểm soát</h2>
            <p className="landing-section__sub">
              Người dùng càng ít phải đoán, tỷ lệ hoàn tất lịch hẹn càng cao. Đây là luồng mà landing page đang chuẩn bị tinh thần cho họ.
            </p>
          </div>
        </div>

        <div className="landing-flow-grid">
          {FLOW_STEPS.map((item) => (
            <article key={item.step} className="landing-flow-card">
              <div className="landing-flow-card__step">{item.step}</div>
              <h3 className="landing-flow-card__title">{item.title}</h3>
              <p className="landing-flow-card__copy">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section--contact" id="contact">
        <div className="landing-section__header">
          <div className="landing-step-num">05</div>
          <div>
            <h2 className="landing-section__title">Luôn có điểm chạm rõ ràng để đi tiếp</h2>
            <p className="landing-section__sub">
              Dù người dùng muốn đặt ngay, tra cứu lại hay cần người thật hỗ trợ, trang chủ vẫn phải chỉ ra đường đi tiếp theo một cách dứt khoát.
            </p>
          </div>
        </div>

        <div className="landing-contact-grid">
          {CONTACT_POINTS.map((item) => (
            <article key={item.label} className="landing-contact-card">
              <div className="landing-contact-card__icon">
                <item.icon className="mc-icon mc-icon--md" />
              </div>
              <div className="landing-contact-card__label">{item.label}</div>
              <div className="landing-contact-card__value">{item.value}</div>
              <div className="landing-contact-card__meta">{item.meta}</div>
            </article>
          ))}
        </div>

        <div className="landing-contact-cta">
          <div>
            <div className="landing-contact-cta__eyebrow">Sẵn sàng hành động</div>
            <div className="landing-contact-cta__title">
              Nếu người dùng đã hiểu giá trị và thấy đường đi rõ ràng, trang chủ phải đưa họ tới booking ngay lập tức.
            </div>
          </div>
          <button className="landing-btn-primary" onClick={() => navigate("/book")}>
            Bắt đầu đặt lịch
            <ArrowRight className="mc-icon mc-icon--sm" />
          </button>
        </div>
      </section>
    </div>
  );
}
