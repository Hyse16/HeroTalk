package org.herotalk.domain.admin.service;

import lombok.RequiredArgsConstructor;
import org.herotalk.domain.admin.dto.AdminItemRequest;
import org.herotalk.domain.item.entity.Item;
import org.herotalk.domain.item.repository.ItemRepository;
import org.herotalk.global.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminItemService {

    private final ItemRepository itemRepository;

    @Transactional(readOnly = true)
    public Page<Item> getItems(Pageable pageable) {
        return itemRepository.findAll(pageable);
    }

    @Transactional
    public Item create(AdminItemRequest req) {
        return itemRepository.save(Item.builder()
                .name(req.getName())
                .description(req.getDescription())
                .itemType(req.getItemType())
                .effectValue(req.getEffectValue())
                .price(req.getPrice())
                .build());
    }

    @Transactional
    public Item update(Long id, AdminItemRequest req) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", id));
        return item.update(req.getName(), req.getDescription(),
                req.getItemType(), req.getEffectValue(), req.getPrice());
    }

    @Transactional
    public void delete(Long id) {
        itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", id));
        itemRepository.deleteById(id);
    }
}
