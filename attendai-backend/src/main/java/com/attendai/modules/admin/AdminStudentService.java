package com.attendai.modules.admin;

import com.attendai.common.exception.ApiException;
import com.attendai.common.exception.ResourceNotFoundException;
import com.attendai.domain.course.Section;
import com.attendai.domain.course.SectionRepository;
import com.attendai.domain.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reference implementation for an admin module. All other admin services
 * (teachers, courses, sections, enrollments) follow this same shape:
 *
 *   1. validate input
 *   2. fetch related entities (throw ResourceNotFoundException if missing)
 *   3. enforce unique constraints (throw ApiException with CONFLICT)
 *   4. persist
 *   5. return a DTO (never a JPA entity)
 */
@Service
@RequiredArgsConstructor
public class AdminStudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final SectionRepository sectionRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public StudentDto create(CreateStudentRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "USER_DUPLICATE_EMAIL",
                    "Email already in use");
        }
        if (studentRepository.existsByRegistrationNumber(req.registrationNumber())) {
            throw new ApiException(HttpStatus.CONFLICT, "STUDENT_DUPLICATE_REG",
                    "Registration number already in use");
        }

        Section section = req.sectionId() == null ? null
                : sectionRepository.findById(req.sectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Section", req.sectionId()));

        User user = User.builder()
                .fullName(req.fullName())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();
        user = userRepository.save(user);

        Student student = Student.builder()
                .user(user)
                .registrationNumber(req.registrationNumber())
                .department(req.department())
                .semester(req.semester())
                .section(section)
                .build();
        student = studentRepository.save(student);

        return StudentDto.from(student);
    }

    @Transactional(readOnly = true)
    public Page<StudentDto> search(Long sectionId, String department, String search, Pageable pageable) {
        return studentRepository.search(sectionId, department, search, pageable)
                .map(StudentDto::from);
    }

    @Transactional(readOnly = true)
    public StudentDto get(Long id) {
        return studentRepository.findById(id)
                .map(StudentDto::from)
                .orElseThrow(() -> new ResourceNotFoundException("Student", id));
    }

    @Transactional
    public StudentDto update(Long id, UpdateStudentRequest req) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", id));

        if (req.fullName() != null) student.getUser().setFullName(req.fullName());
        if (req.department() != null) student.setDepartment(req.department());
        if (req.semester() != null) student.setSemester(req.semester());
        if (req.status() != null) student.getUser().setStatus(req.status());
        if (req.sectionId() != null) {
            Section section = sectionRepository.findById(req.sectionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Section", req.sectionId()));
            student.setSection(section);
        }
        return StudentDto.from(studentRepository.save(student));
    }

    @Transactional
    public void deactivate(Long id) {
        Student s = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", id));
        s.getUser().setStatus(UserStatus.INACTIVE);
        userRepository.save(s.getUser());
    }
}
