package com.attendai.domain.security;

import com.attendai.common.audit.Auditable;
import com.attendai.domain.user.Student;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "face_profiles",
        uniqueConstraints = @UniqueConstraint(name = "uk_face_student", columnNames = "student_id")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceProfile extends Auditable {

    public enum Status { PENDING, ACTIVE, REJECTED, REVOKED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "face_embedding_path", length = 300)
    private String faceEmbeddingPath;

    @Column(name = "image_path", length = 300)
    private String imagePath;

    @Column(name = "embedding_quality")
    private Double embeddingQuality;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.PENDING;
}
