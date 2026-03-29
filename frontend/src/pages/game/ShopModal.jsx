import { useState, useEffect } from 'react'
import useCharacterStore from '@/store/characterStore'
import { getItems, getCosmetics, buyItem, buyCosmetic } from '@/api/shopApi'
import './ShopModal.css'

const RARITY_LABEL = {
  COMMON: '일반',
  RARE: '레어',
  EPIC: '에픽',
  LEGENDARY: '전설',
}

const ITEM_TYPE_LABEL = {
  HP_POTION: 'HP 포션',
  XP_BOOSTER: 'XP 부스터',
  TIME_EXTEND: '시간 연장',
  RETRY: '재도전권',
  HINT_BOOST: '힌트 강화',
}

export default function ShopModal({ onClose }) {
  const character = useCharacterStore((s) => s.character)
  const setCharacter = useCharacterStore((s) => s.setCharacter)

  const [activeTab, setActiveTab] = useState('items')
  const [items, setItems] = useState([])
  const [cosmetics, setCosmetics] = useState([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(null)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [quantities, setQuantities] = useState({})

  useEffect(() => {
    setLoading(true)
    setError(null)
    const fetcher = activeTab === 'items' ? getItems() : getCosmetics()
    fetcher
      .then((list) => {
        if (activeTab === 'items') setItems(list)
        else setCosmetics(list)
      })
      .catch(() => setError('목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [activeTab])

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 2500)
  }

  const handleBuyItem = async (item) => {
    const qty = quantities[item.id] ?? 1
    const totalCost = item.price * qty
    if ((character?.gold ?? 0) < totalCost) {
      setError('골드가 부족합니다.')
      return
    }
    setError(null)
    setBuying(item.id)
    try {
      const updated = await buyItem(item.id, qty)
      setCharacter(updated)
      showSuccess(`${item.name} × ${qty} 구매 완료!`)
    } catch {
      setError('구매에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setBuying(null)
    }
  }

  const handleBuyCosmetic = async (cosmetic) => {
    if (cosmetic.owned) return
    if ((character?.gold ?? 0) < cosmetic.price) {
      setError('골드가 부족합니다.')
      return
    }
    setError(null)
    setBuying(cosmetic.id)
    try {
      const updated = await buyCosmetic(cosmetic.id)
      setCharacter(updated)
      setCosmetics((prev) =>
        prev.map((c) => (c.id === cosmetic.id ? { ...c, owned: true } : c))
      )
      showSuccess(`${cosmetic.name} 구매 완료!`)
    } catch {
      setError('구매에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setBuying(null)
    }
  }

  const setQty = (itemId, value) => {
    const n = Math.max(1, Math.min(5, Number(value)))
    setQuantities((prev) => ({ ...prev, [itemId]: n }))
  }

  return (
    <div className="shop-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="shop-panel">
        <div className="shop-header">
          <div className="shop-title">🏪 상점</div>
          <div className="shop-gold">💰 {character?.gold ?? 0} G</div>
        </div>

        <div className="shop-tabs">
          <button
            className={`shop-tab${activeTab === 'items' ? ' active' : ''}`}
            onClick={() => { setActiveTab('items'); setError(null) }}
          >
            아이템
          </button>
          <button
            className={`shop-tab${activeTab === 'cosmetics' ? ' active' : ''}`}
            onClick={() => { setActiveTab('cosmetics'); setError(null) }}
          >
            코스튬
          </button>
        </div>

        {error && <div className="shop-error">⚠ {error}</div>}
        {successMsg && <div className="shop-success">✔ {successMsg}</div>}

        {loading ? (
          <div className="shop-loading">불러오는 중...</div>
        ) : activeTab === 'items' ? (
          <div className="shop-item-list">
            {items.length === 0 && (
              <div className="shop-empty">판매 중인 아이템이 없습니다.</div>
            )}
            {items.map((item) => {
              const qty = quantities[item.id] ?? 1
              const totalCost = item.price * qty
              const canAfford = (character?.gold ?? 0) >= totalCost
              return (
                <div key={item.id} className="shop-item-card">
                  <div className="shop-item-info">
                    <div className="shop-item-name">{item.name}</div>
                    <div className="shop-item-type">{ITEM_TYPE_LABEL[item.itemType] ?? item.itemType}</div>
                    <div className="shop-item-desc">{item.description}</div>
                    <div className="shop-item-effect">효과: +{item.effectValue}</div>
                  </div>
                  <div className="shop-item-action">
                    <div className="shop-item-price">
                      💰 {totalCost} G
                      {qty > 1 && <span className="shop-unit-price"> ({item.price}G × {qty})</span>}
                    </div>
                    <div className="shop-qty-row">
                      <button
                        className="shop-qty-btn"
                        onClick={() => setQty(item.id, qty - 1)}
                        disabled={qty <= 1}
                      >−</button>
                      <span className="shop-qty-val">{qty}</span>
                      <button
                        className="shop-qty-btn"
                        onClick={() => setQty(item.id, qty + 1)}
                        disabled={qty >= 5}
                      >+</button>
                    </div>
                    <button
                      className={`shop-buy-btn${!canAfford ? ' no-gold' : ''}`}
                      onClick={() => handleBuyItem(item)}
                      disabled={buying === item.id || !canAfford}
                    >
                      {buying === item.id ? '구매 중...' : '구매'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="shop-cosmetic-list">
            {cosmetics.length === 0 && (
              <div className="shop-empty">판매 중인 코스튬이 없습니다.</div>
            )}
            {cosmetics.map((cosmetic) => {
              const canAfford = (character?.gold ?? 0) >= cosmetic.price
              return (
                <div key={cosmetic.id} className={`shop-cosmetic-card${cosmetic.owned ? ' owned' : ''}`}>
                  <div className="shop-cosmetic-info">
                    <div className="shop-cosmetic-name">
                      {cosmetic.name}
                      {cosmetic.owned && <span className="shop-owned-badge">보유</span>}
                    </div>
                    <div
                      className="shop-rarity-badge"
                      data-rarity={cosmetic.rarity}
                    >
                      {RARITY_LABEL[cosmetic.rarity] ?? cosmetic.rarity}
                    </div>
                    <div className="shop-cosmetic-type">{cosmetic.cosmeticType}</div>
                    <div className="shop-cosmetic-desc">{cosmetic.description}</div>
                  </div>
                  <div className="shop-item-action">
                    <div className="shop-item-price">💰 {cosmetic.price} G</div>
                    {cosmetic.owned ? (
                      <button className="shop-buy-btn owned" disabled>보유 중</button>
                    ) : (
                      <button
                        className={`shop-buy-btn${!canAfford ? ' no-gold' : ''}`}
                        onClick={() => handleBuyCosmetic(cosmetic)}
                        disabled={buying === cosmetic.id || !canAfford}
                      >
                        {buying === cosmetic.id ? '구매 중...' : '구매'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="shop-actions">
          <button className="shop-close-btn" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
}
