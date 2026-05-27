package com.attendai.modules.admin;

import com.attendai.common.exception.ApiException;
import com.attendai.common.exception.ResourceNotFoundException;
import com.attendai.domain.user.*;
import com.attendai.modules.admin.TeacherDtos.CreateTeacherRequest;
import com.attendai.modules.admin.TeacherDtos.TeacherDto;
import com.attendai.modules.admin.TeacherDtos.UpdateTeacherRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminTeacherService {

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public TeacherDto create(CreateTeacherRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "USER_DUPLICATE_EMAIL", "Email already in use");
        }
        if (teacherRepository.existsByEmployeeId(req.employeeId())) {
            throw new ApiException(HttpStatus.CONFLICT, "TEACHER_DUPLICATE_EMP_ID", "Employee id already in use");
        }
        User user = userRepository.save(User.builder()
                .fullName(req.fullName())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(Role.TEACHER)
                .status(UserStatus.ACTIVE)
                .build());
        Teacher teacher = teacherRepository.save(Teacher.builder()
                .user(user)
                .employeeId(req.employeeId())
                .department(req.department())
                .designation(req.designation())
                .build());
        return TeacherDto.from(teacher);
    }

    @Transactional(readOnly = true)
    public Page<TeacherDto> search(String department, String search, Pageable pageable) {
        return teacherRepository.search(department, search, pageable).map(TeacherDto::from);
    }

    @Transactional(readOnly = true)
    public TeacherDto get(Long id) {
        return teacherRepository.findById(id).map(TeacherDto::from)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
    }

    @Transactional
    public TeacherDto update(Long id, UpdateTeacherRequest req) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        if (req.fullName() != null) teacher.getUser().setFullName(req.fullName());
        if (req.department() != null) teacher.setDepartment(req.department());
        if (req.designation() != null) teacher.setDesignation(req.designation());
        if (req.status() != null) teacher.getUser().setStatus(req.status());
        return TeacherDto.from(teacherRepository.save(teacher));
    }

    @Transactional
    public void deactivate(Long id) {
        Teacher t = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        t.getUser().setStatus(UserStatus.INACTIVE);
        userRepository.save(t.getUser());
    }
}
