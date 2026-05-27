package com.attendai.domain.user;

import com.attendai.common.audit.Auditable;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "admins",
        uniqueConstraints = @UniqueConstraint(name = "uk_admins_user_id", columnNames = "user_id")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Admin extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 80)
    private String designation;
}
