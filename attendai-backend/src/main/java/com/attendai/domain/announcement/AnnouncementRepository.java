package com.attendai.domain.announcement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    /**
     * Feed for a given set of audiences (e.g. ALL + STUDENTS for a student),
     * pinned notices first, then newest first.
     */
    Page<Announcement> findByAudienceInOrderByPinnedDescCreatedAtDesc(
            Collection<Announcement.Audience> audiences, Pageable pageable);

    /** Admin view: everything, pinned first then newest. */
    Page<Announcement> findAllByOrderByPinnedDescCreatedAtDesc(Pageable pageable);
}
