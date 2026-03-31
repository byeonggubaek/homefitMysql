import { useUser } from "@/hooks/UserContext";
import { ShoppingCart, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react";
import type { Goods } from "shared";

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`
const formatPoints = (points: number) => `${points.toLocaleString("ko-KR")}P`
const getOriginalPrice = (price: number, discount: number) =>
  Math.round(price / (1 - discount / 100))

export default function RewardMallMain() {
  const { member } = useUser(); 
  const [cartItems, setCartItems] = useState<number[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const [rewardItems, setRewardItems] = useState<Goods[]>([]);

  useEffect(() => {
    fetch(`http://localhost:3001/api/reward/getGoods`)
      .then(res => res.json())
      .then(data => setRewardItems(data.data || []));
  }, []);

  const handleAddToCart = (itemId: number) => {
    setCartItems((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]))
  }

  const handleRemoveFromCart = (itemId: number) => {
    setCartItems((prev) => prev.filter((id) => id !== itemId))
  }

  const cartProducts = rewardItems.filter((item) => cartItems.includes(item.GOD_ID))
  const cartCount = cartProducts.length

  const cartTotalPrice = useMemo(() => {
    return cartProducts.reduce((sum, item) => sum + item.GOD_PRICE, 0)
  }, [cartProducts])

  return (
    <div className="w-full min-h-screen bg-[#F4FAF9] text-[#1F2E30]">
      {/* 헤더 */}
      <header className="border-b border-[#D9EEEA] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-[2rem] font-black tracking-tight text-[#02899C]">
              FitStore
            </div>
            <p className="text-base text-[#5A7C80]">
              운동으로 모은 포인트로 혜택을 받아보세요
            </p>
          </div>

          <button
            type="button"
            className="relative rounded-full border-2 border-[#7FCDC4] bg-white p-4 text-[#02899C] transition-all hover:-translate-y-0.5 hover:shadow-lg"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="h-9 w-9" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-9 min-w-9 items-center justify-center rounded-full bg-[#02899C] px-2 text-lg font-bold text-white shadow-md">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* 포인트 카드 */}
        <section className="mb-10 overflow-hidden rounded-[2rem] p-8 shadow-xl bg-[#02899C] text-white">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-2xl font-semibold tracking-[0.18em] opacity-90">
                MY POINT
              </p>
              <div className="mt-4 flex items-end gap-3">
                <span className="font-mono text-7xl font-black tracking-tight sm:text-8xl">
                  {member?.MEM_POINT ? formatPoints(member?.MEM_POINT) : "0P"}
                </span>
                <span className="mb-2 text-3xl font-bold sm:text-4xl">P</span>
              </div>

              <p className="mt-4 text-xl">
                포인트로 다양한 리워드를 만나보세요! 
              </p>
            </div>

            <div className="grid w-full max-w-xl grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white/15 p-5 backdrop-blur-sm">
                <p className="text-lg">이번 달에 적립 될 포인트</p>
                <p className="mt-2 text-3xl font-bold">+1,250P</p>
              </div>
              <div className="rounded-3xl bg-white/15 p-5 backdrop-blur-sm">
                <p className="text-lg ">사용 가능</p>
                <p className="mt-2 text-3xl font-bold">
                  {member?.MEM_POINT ? formatPoints(member?.MEM_POINT) : "0P"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 헤더 */}
        <section className="mb-6">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-[#02899C]">
              추천 리워드
            </h2>
            <p className="mt-2 text-xl text-[#5A7C80]">
              인기 운동 용품을 포인트몰 혜택가로 만나보세요
            </p>
          </div>
        </section>

        {/* 상품 그리드 */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {rewardItems.map((item) => (
            <div key={item.GOD_ID} className="p-1">
              <article className="group overflow-hidden rounded-2xl border border-[#BFE6E0] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => handleAddToCart(item.GOD_ID)}
                >
                  <div className="relative aspect-square overflow-hidden bg-[#EFF9F7]">
                    <img
                      src={item.GOD_IMG || "/goods/default.jpg"}
                      alt={item.GOD_NAME}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />

                    <div className="absolute left-3 top-3 rounded-full bg-[#FF5F5F] px-3 py-1 text-sm font-bold text-white shadow-md">
                      {item.GOD_DCRATE }% 할인
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/55 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="inline-flex rounded-full bg-white px-4 py-2 text-base font-bold text-[#02899C] shadow">
                        장바구니 담기
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-[1.15rem] font-bold leading-snug text-[#203436]">
                      {item.GOD_NAME}
                    </p>

                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-[1.35rem] font-black text-[#02899C]">
                        {formatPrice(item.GOD_PRICE)}
                      </span>
                      <span className="pb-0.5 text-sm text-gray-400 line-through">
                        {formatPrice(getOriginalPrice(item.GOD_PRICE, item.GOD_DCRATE))}
                      </span>
                    </div>
                  </div>
                </button>
              </article>
            </div>
          ))}
        </section>
      </main>

      {/* 장바구니 모달 */}
      {isCartOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E7F3F0] px-6 py-5">
              <div>
                <h3 className="text-3xl font-black text-[#02899C]">장바구니</h3>
                <p className="mt-1 text-base text-[#5A7C80]">
                  담은 상품 {cartCount}개
                </p>
              </div>

              <button
                type="button"
                className="rounded-full p-2 transition-colors hover:bg-[#F2FAF8]"
                onClick={() => setIsCartOpen(false)}
              >
                <X className="h-7 w-7 text-[#02899C]" />
              </button>
            </div>

            <div className="max-h-105 overflow-y-auto px-6 py-5">
              {cartProducts.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-2xl font-bold text-[#02899C]">
                    장바구니가 비어 있습니다.
                  </p>
                  <p className="mt-3 text-lg text-[#5A7C80]">
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartProducts.map((item) => (
                    <div
                      key={item.GOD_ID}
                      className="flex items-center gap-4 rounded-3xl border border-[#DCEFEB] bg-[#FBFEFD] p-4"
                    >
                      <img
                        src={item.GOD_IMG || "/goods/default.jpg"}
                        alt={item.GOD_NAME}
                        className="h-24 w-24 rounded-2xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xl font-bold text-[#1F3436]">
                          {item.GOD_NAME}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-[#02899C]">
                          {formatPrice(item.GOD_PRICE)}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="shrink-0 rounded-full bg-[#02899C] px-4 py-2 text-base font-bold text-white transition-opacity hover:opacity-90"
                        onClick={() => handleRemoveFromCart(item.GOD_ID)}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartProducts.length > 0 && (
              <div className="border-t border-[#E7F3F0] bg-[#F8FCFB] px-6 py-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-lg text-[#5A7C80]">담은 상품 수</span>
                  <span className="text-xl font-bold text-[#02899C]">
                    {cartCount}개
                  </span>
                </div>

                <div className="mb-5 flex items-center justify-between">
                  <span className="text-lg text-[#5A7C80]">총액</span>
                  <span className="text-3xl font-black text-[#02899C]">
                    {formatPrice(cartTotalPrice)}
                  </span>
                </div>

                <button
                  type="button"
                  className="w-full rounded-2xl bg-[#02899C] py-4 text-xl font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  onClick={() => {
                    console.log("결제 페이지로 이동")
                    setIsCartOpen(false)
                  }}
                >
                  총 {formatPrice(cartTotalPrice)} 결제하러 가기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}