package com.klsmartq.repository;

import com.klsmartq.entity.TempRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TempRegistrationRepository extends JpaRepository<TempRegistration, String> {
}
