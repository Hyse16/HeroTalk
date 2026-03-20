package org.herotalk.domain.character.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.herotalk.domain.character.entity.Character;

@Getter
@NoArgsConstructor
public class CharacterCreateRequest {

    @NotBlank(message = "캐릭터 이름은 필수입니다")
    @Size(min = 2, max = 20, message = "캐릭터 이름은 2자 이상 20자 이하이어야 합니다")
    private String name;

    @NotNull(message = "직업은 필수입니다")
    private Character.Job job;
}
