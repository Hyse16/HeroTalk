package org.herotalk.domain.character.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class StatAllocateRequest {

    @NotBlank
    private String statName; // fluency, grammar, vocabulary, delivery

    @Min(1)
    @Max(10)
    private int amount;
}
