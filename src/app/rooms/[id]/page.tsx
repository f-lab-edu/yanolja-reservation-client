"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  roomApi,
  getImageUrl,
  reservationApi,
  couponApi,
  orderApi,
  paymentApi,
} from "@/lib/api";
import { PortalRoom } from "@/types/room";
import { ReservationRequest } from "@/types/reservation";
import { useAuth } from "@/contexts/AuthContext";
import {
  UserCouponResponse,
  UserCouponStatus,
  DiscountType,
  OrderRequest,
  PaymentRequest,
  PaymentMethod,
} from "@/types/payment";
import {
  requestTossPaymentByMethod,
  TossPaymentRequest,
} from "@/lib/toss-payments";

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [room, setRoom] = useState<PortalRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isBooking, setIsBooking] = useState(false);

  // 예약 폼 데이터
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: number]: number;
  }>({});

  // 예약 처리 상태
  const [totalPrice, setTotalPrice] = useState(0);
  const [nights, setNights] = useState(0);

  // 쿠폰 및 결제 관련 상태
  const [availableCoupons, setAvailableCoupons] = useState<
    UserCouponResponse[]
  >([]);
  const [selectedCoupon, setSelectedCoupon] =
    useState<UserCouponResponse | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>(PaymentMethod.CARD);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const roomId = Number(params.id);

  useEffect(() => {
    if (roomId) {
      fetchRoomDetail();
    }
  }, [roomId]);

  const fetchRoomDetail = async () => {
    try {
      setIsLoading(true);
      const response = await roomApi.getPortalRoomDetail(roomId);
      setRoom(response.data);
    } catch (error) {
      console.error("객실 상세 정보 조회 실패:", error);
      setError("객실 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 총 가격 계산
  const calculateTotalPrice = () => {
    if (!room || !checkInDate || !checkOutDate) return;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nightCount = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (nightCount <= 0) return;

    let total = room.pricePerNight * nightCount;

    // 선택된 옵션 가격 추가
    if (room.options) {
      room.options.forEach((option) => {
        const quantity = selectedOptions[option.id] || 0;
        total += option.price * quantity * nightCount;
      });
    }

    setNights(nightCount);
    setTotalPrice(total);
  };

  // 사용 가능한 쿠폰 로딩
  const loadAvailableCoupons = async () => {
    if (!user || totalPrice <= 0) return;

    try {
      const coupons = await couponApi.getUsableCoupons(user.id, totalPrice);
      setAvailableCoupons(coupons);
    } catch (error) {
      console.error("쿠폰 로딩 실패:", error);
    }
  };

  // 쿠폰 할인 금액 계산
  const calculateDiscount = async (coupon: UserCouponResponse | null) => {
    if (!coupon || totalPrice <= 0) {
      setDiscountAmount(0);
      setFinalAmount(totalPrice);
      return;
    }

    try {
      const response = await couponApi.calculateDiscount({
        couponId: coupon.coupon.id,
        orderAmount: totalPrice,
      });

      setDiscountAmount(response.discountAmount);
      setFinalAmount(totalPrice - response.discountAmount);
    } catch (error: any) {
      console.error("할인 계산 실패:", error);
      setDiscountAmount(0);
      setFinalAmount(totalPrice);

      // 쿠폰 사용 불가 메시지 표시
      let errorMessage = "쿠폰 할인 금액을 계산할 수 없습니다.";
      if (error.message) {
        if (
          error.message.includes("쿠폰") ||
          error.message.includes("coupon")
        ) {
          errorMessage = `이 쿠폰은 현재 사용할 수 없습니다.\n사유: ${error.message}`;
        }
      }

      alert(errorMessage);
      setSelectedCoupon(null); // 사용할 수 없는 쿠폰은 선택 해제
    }
  };

  // 날짜나 옵션 변경 시 가격 재계산
  useEffect(() => {
    calculateTotalPrice();
  }, [checkInDate, checkOutDate, selectedOptions, room]);

  // 총 가격 변경 시 쿠폰 로딩
  useEffect(() => {
    if (totalPrice > 0) {
      loadAvailableCoupons();
    }
  }, [totalPrice, user]);

  // 쿠폰 선택 시 할인 계산
  useEffect(() => {
    calculateDiscount(selectedCoupon);
  }, [selectedCoupon, totalPrice]);

  // 예약 처리 (결제 모달 열기)
  const handleReservation = async () => {
    if (!isAuthenticated) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
        router.push("/login");
      }
      return;
    }

    if (!checkInDate || !checkOutDate) {
      alert("체크인/체크아웃 날짜를 선택해주세요.");
      return;
    }

    // 오늘 날짜와 비교하여 과거 날짜 검증
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn < today) {
      alert("체크인 날짜는 오늘 이후여야 합니다.");
      return;
    }

    if (checkOut <= checkIn) {
      alert("체크아웃 날짜는 체크인 날짜보다 이후여야 합니다.");
      return;
    }

    // 결제 모달 열기
    setShowPaymentModal(true);
  };

  // 실제 예약 및 결제 처리
  const processReservationAndPayment = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 토큰 확인
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
      return;
    }

    try {
      setIsProcessingPayment(true);

      // 1. 예약 생성
      const reservationData: ReservationRequest = {
        roomId: roomId,
        checkInDate,
        checkOutDate,
        totalPrice,
        options: room?.options
          ?.map((option) => ({
            optionId: option.id,
            quantity: selectedOptions[option.id] || 0,
            price: option.price,
          }))
          .filter((opt) => opt.quantity > 0),
      };

      console.log("예약 생성 요청:", reservationData);
      const reservationResponse = await reservationApi.createReservation(
        reservationData
      );
      console.log("예약 생성 응답:", reservationResponse);

      // 예약 응답 검증
      if (
        !reservationResponse ||
        !reservationResponse.data ||
        !reservationResponse.data.id
      ) {
        console.error("예약 응답이 유효하지 않습니다:", reservationResponse);
        throw new Error("예약 생성에 실패했습니다. 다시 시도해주세요.");
      }

      // 2. 주문 생성
      let orderResponse;
      let finalOrderAmount = finalAmount;

      // 쿠폰이 선택된 경우 먼저 쿠폰과 함께 시도
      if (selectedCoupon) {
        try {
          const orderDataWithCoupon: OrderRequest = {
            userId: user.id,
            reservationId: reservationResponse.data.id,
            originalAmount: totalPrice,
            couponIds: [selectedCoupon.coupon.id],
            pointsUsed: 0,
          };

          console.log("쿠폰 포함 주문 생성 요청:", orderDataWithCoupon);
          orderResponse = await orderApi.createOrder(orderDataWithCoupon);
          console.log("쿠폰 포함 주문 생성 성공:", orderResponse);
        } catch (couponError: any) {
          console.log("쿠폰 사용 실패, 쿠폰 없이 재시도:", couponError.message);

          // 쿠폰 관련 오류인 경우 쿠폰 없이 재시도
          if (couponError.message.includes("쿠폰")) {
            const shouldRetryWithoutCoupon = confirm(
              `선택한 쿠폰을 사용할 수 없습니다.\n쿠폰 없이 주문을 진행하시겠습니까?\n\n오류: ${couponError.message}`
            );

            if (!shouldRetryWithoutCoupon) {
              throw new Error("주문이 취소되었습니다.");
            }

            // 쿠폰 없이 다시 시도
            const orderDataWithoutCoupon: OrderRequest = {
              userId: user.id,
              reservationId: reservationResponse.data.id,
              originalAmount: totalPrice,
              couponIds: [],
              pointsUsed: 0,
            };

            console.log("쿠폰 없는 주문 생성 요청:", orderDataWithoutCoupon);
            orderResponse = await orderApi.createOrder(orderDataWithoutCoupon);
            finalOrderAmount = totalPrice; // 쿠폰 할인 없이 원래 가격으로 설정
            console.log("쿠폰 없는 주문 생성 성공:", orderResponse);
          } else {
            throw couponError;
          }
        }
      } else {
        // 처음부터 쿠폰이 선택되지 않은 경우
        const orderData: OrderRequest = {
          userId: user.id,
          reservationId: reservationResponse.data.id,
          originalAmount: totalPrice,
          couponIds: [],
          pointsUsed: 0,
        };

        console.log("주문 생성 요청:", orderData);
        orderResponse = await orderApi.createOrder(orderData);
        console.log("주문 생성 응답:", orderResponse);
      }

      // 주문 응답 검증
      if (!orderResponse || !orderResponse.orderNumber) {
        console.error("주문 응답이 유효하지 않습니다:", orderResponse);
        throw new Error("주문 생성에 실패했습니다. 다시 시도해주세요.");
      }

      // 3. 토스 페이먼츠 결제 처리
      console.log("토스 페이먼츠 결제 시작...");

      // 토스 페이먼츠로 결제 요청
      const tossPaymentData: TossPaymentRequest = {
        orderId: orderResponse.orderNumber,
        amount: finalOrderAmount,
        orderName: `${room.name} ${nights}박 숙박`,
        customerName: user.name,
        customerEmail: user.email,
        customerMobilePhone: user.phone,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      };

      console.log("토스 페이먼츠 요청 데이터:", tossPaymentData);

      // 결제 수단에 따라 토스 페이먼츠 호출
      if (selectedPaymentMethod === PaymentMethod.CARD) {
        await requestTossPaymentByMethod("CARD", tossPaymentData);
      } else if (selectedPaymentMethod === PaymentMethod.BANK_TRANSFER) {
        await requestTossPaymentByMethod("BANK_TRANSFER", tossPaymentData);
      } else if (selectedPaymentMethod === PaymentMethod.VIRTUAL_ACCOUNT) {
        await requestTossPaymentByMethod("VIRTUAL_ACCOUNT", tossPaymentData);
      } else if (selectedPaymentMethod === PaymentMethod.TOSS) {
        await requestTossPaymentByMethod("TOSS", tossPaymentData);
      } else {
        throw new Error("지원하지 않는 결제 수단입니다.");
      }

      // 토스 페이먼츠가 리다이렉트를 처리하므로 여기서는 실행되지 않음
    } catch (error: any) {
      console.error("예약/결제 실패:", error);

      let errorMessage = "예약/결제에 실패했습니다. 다시 시도해주세요.";

      if (error.message) {
        if (
          error.message.includes("userDetail") ||
          error.message.includes("인증")
        ) {
          errorMessage = "로그인이 만료되었습니다. 다시 로그인해주세요.";
        } else if (error.message.includes("주문 생성")) {
          errorMessage = "주문 생성에 실패했습니다. 다시 시도해주세요.";
        } else if (error.message.includes("예약 생성")) {
          errorMessage = "예약 생성에 실패했습니다. 다시 시도해주세요.";
        } else if (error.message.includes("결제")) {
          errorMessage = "결제 처리에 실패했습니다. 다시 시도해주세요.";
        } else {
          errorMessage = error.message;
        }
      }

      alert(errorMessage);
    } finally {
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
    }
  };

  // 날짜 변경 처리
  const handleCheckInDateChange = (date: string) => {
    setCheckInDate(date);

    // 체크인 날짜가 체크아웃 날짜와 같거나 이후라면 체크아웃 날짜를 자동으로 조정
    if (checkOutDate && date >= checkOutDate) {
      const nextDay = new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000);
      setCheckOutDate(nextDay.toISOString().split("T")[0]);
    }
  };

  const handleCheckOutDateChange = (date: string) => {
    setCheckOutDate(date);
  };

  // 옵션 수량 변경
  const handleOptionChange = (optionId: number, quantity: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: Math.max(0, quantity),
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">객실 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || "객실을 찾을 수 없습니다"}
          </h2>
          <Link
            href="/accommodations"
            className="text-blue-600 hover:text-blue-500"
          >
            숙소 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 */}
        <Link
          href={`/accommodations/${room.accommodationId}`}
          className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          숙소로 돌아가기
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 객실 이미지 갤러리 */}
          <div className="p-6">
            {room.imageUrls && room.imageUrls.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* 메인 이미지 */}
                <div className="lg:col-span-3">
                  <img
                    src={getImageUrl(room.imageUrls[selectedImageIndex])}
                    alt={room.name}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>

                {/* 썸네일 이미지들 */}
                <div className="lg:col-span-1 space-y-2">
                  {room.imageUrls.slice(0, 4).map((imageUrl, index) => (
                    <img
                      key={index}
                      src={getImageUrl(imageUrl)}
                      alt={`${room.name} ${index + 1}`}
                      className={`w-full h-20 object-cover rounded-lg cursor-pointer transition-opacity ${
                        selectedImageIndex === index
                          ? "opacity-100 ring-2 ring-blue-500"
                          : "opacity-70 hover:opacity-100"
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    />
                  ))}
                  {room.imageUrls.length > 4 && (
                    <div className="w-full h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                      +{room.imageUrls.length - 4}장 더보기
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* 객실 정보 및 예약 폼 */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 왼쪽: 객실 정보 */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {room.name}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <span>최대 {room.capacity}명</span>
                    <span>•</span>
                    <div className="flex items-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          room.status === "AVAILABLE"
                            ? "bg-green-400"
                            : "bg-red-400"
                        }`}
                      ></span>
                      {room.status === "AVAILABLE" ? "예약 가능" : "예약 불가"}
                    </div>
                  </div>
                </div>

                {room.description && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">
                      객실 소개
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      {room.description}
                    </p>
                  </div>
                )}

                {/* 객실 옵션 */}
                {room.options && room.options.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">
                      추가 옵션
                    </h2>
                    <div className="space-y-3">
                      {room.options.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex-1">
                            <span className="text-gray-700 font-medium">
                              {option.name}
                            </span>
                            <div className="text-sm text-gray-500">
                              +₩{option.price.toLocaleString()} / 박
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                handleOptionChange(
                                  option.id,
                                  (selectedOptions[option.id] || 0) - 1
                                )
                              }
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                              disabled={!selectedOptions[option.id]}
                            >
                              -
                            </button>
                            <span className="w-8 text-center">
                              {selectedOptions[option.id] || 0}
                            </span>
                            <button
                              onClick={() =>
                                handleOptionChange(
                                  option.id,
                                  (selectedOptions[option.id] || 0) + 1
                                )
                              }
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 이용 안내 */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    이용 안내
                  </h2>
                  <div className="space-y-2 text-gray-700">
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      체크인: 15:00 이후
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      체크아웃: 11:00 이전
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      무료 Wi-Fi
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      금연 객실
                    </div>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 예약 카드 */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6 sticky top-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-gray-900">
                      ₩{room.pricePerNight.toLocaleString()}
                    </div>
                    <div className="text-gray-600">/ 박</div>
                  </div>

                  {room.status === "AVAILABLE" ? (
                    <>
                      {/* 예약 폼 */}
                      <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              체크인
                            </label>
                            <input
                              type="date"
                              value={checkInDate}
                              onChange={(e) =>
                                handleCheckInDateChange(e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              min={new Date().toISOString().split("T")[0]}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              체크아웃
                            </label>
                            <input
                              type="date"
                              value={checkOutDate}
                              onChange={(e) =>
                                handleCheckOutDateChange(e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              min={
                                checkInDate
                                  ? new Date(
                                      new Date(checkInDate).getTime() +
                                        24 * 60 * 60 * 1000
                                    )
                                      .toISOString()
                                      .split("T")[0]
                                  : new Date(
                                      new Date().getTime() + 24 * 60 * 60 * 1000
                                    )
                                      .toISOString()
                                      .split("T")[0]
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            인원
                          </label>
                          <select
                            value={guests}
                            onChange={(e) => setGuests(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            {Array.from(
                              { length: room.capacity },
                              (_, i) => i + 1
                            ).map((num) => (
                              <option key={num} value={num}>
                                {num}명
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 쿠폰 선택 */}
                      {checkInDate &&
                        checkOutDate &&
                        nights > 0 &&
                        availableCoupons.length > 0 && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              쿠폰 선택
                            </label>
                            <select
                              value={selectedCoupon?.id || ""}
                              onChange={(e) => {
                                const couponId = e.target.value;
                                const coupon = couponId
                                  ? availableCoupons.find(
                                      (c) => c.id === Number(couponId)
                                    )
                                  : null;
                                setSelectedCoupon(coupon || null);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                              <option value="">쿠폰을 선택하세요</option>
                              {availableCoupons.map((userCoupon) => (
                                <option
                                  key={userCoupon.id}
                                  value={userCoupon.id}
                                >
                                  {userCoupon.coupon.name} -{" "}
                                  {userCoupon.coupon.discountType ===
                                  DiscountType.FIXED
                                    ? `₩${userCoupon.coupon.discountValue.toLocaleString()}`
                                    : `${userCoupon.coupon.discountValue}%`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                      {/* 가격 계산 */}
                      {checkInDate && checkOutDate && nights > 0 && (
                        <div className="mb-6 p-4 bg-white rounded-lg border">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>
                                ₩{room.pricePerNight.toLocaleString()} ×{" "}
                                {nights}박
                              </span>
                              <span>
                                ₩
                                {(room.pricePerNight * nights).toLocaleString()}
                              </span>
                            </div>
                            {room.options &&
                              Object.keys(selectedOptions).some(
                                (id) => selectedOptions[Number(id)] > 0
                              ) && (
                                <>
                                  <div className="text-gray-600 font-medium">
                                    추가 옵션:
                                  </div>
                                  {room.options.map((option) => {
                                    const quantity =
                                      selectedOptions[option.id] || 0;
                                    if (quantity === 0) return null;
                                    return (
                                      <div
                                        key={option.id}
                                        className="flex justify-between text-gray-600"
                                      >
                                        <span>
                                          {option.name} × {quantity} × {nights}
                                          박
                                        </span>
                                        <span>
                                          ₩
                                          {(
                                            option.price *
                                            quantity *
                                            nights
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </>
                              )}
                            <hr />
                            <div className="flex justify-between">
                              <span>소계</span>
                              <span>₩{totalPrice.toLocaleString()}</span>
                            </div>
                            {selectedCoupon && discountAmount > 0 && (
                              <div className="flex justify-between text-red-600">
                                <span>쿠폰 할인</span>
                                <span>-₩{discountAmount.toLocaleString()}</span>
                              </div>
                            )}
                            <hr />
                            <div className="flex justify-between font-semibold text-lg">
                              <span>총 결제 금액</span>
                              <span>
                                ₩{(finalAmount || totalPrice).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleReservation}
                        disabled={!checkInDate || !checkOutDate || nights <= 0}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        예약 및 결제하기
                      </button>
                    </>
                  ) : (
                    <div className="text-center mb-6">
                      <div className="text-gray-500 text-sm mb-3">
                        현재 예약할 수 없는 객실입니다
                      </div>
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed"
                      >
                        예약 불가
                      </button>
                    </div>
                  )}

                  <div className="text-center text-xs text-gray-500">
                    예약 확정 전까지는 요금이 청구되지 않습니다.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 결제 모달 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">결제 정보</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              {/* 예약 정보 요약 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">예약 정보</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>객실: {room?.name}</div>
                  <div>
                    체크인: {new Date(checkInDate).toLocaleDateString("ko-KR")}
                  </div>
                  <div>
                    체크아웃:{" "}
                    {new Date(checkOutDate).toLocaleDateString("ko-KR")}
                  </div>
                  <div>숙박일: {nights}박</div>
                  <div>인원: {guests}명</div>
                </div>
              </div>

              {/* 결제 금액 */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">결제 금액</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>객실 요금</span>
                    <span>₩{totalPrice.toLocaleString()}</span>
                  </div>
                  {selectedCoupon && discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>쿠폰 할인 ({selectedCoupon.coupon.name})</span>
                      <span>-₩{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>총 결제 금액</span>
                    <span>₩{(finalAmount || totalPrice).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 결제 수단 선택 */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">결제 수단</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PaymentMethod.CARD}
                      checked={selectedPaymentMethod === PaymentMethod.CARD}
                      onChange={(e) =>
                        setSelectedPaymentMethod(
                          e.target.value as PaymentMethod
                        )
                      }
                      className="mr-3"
                    />
                    <span>신용카드</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PaymentMethod.BANK_TRANSFER}
                      checked={
                        selectedPaymentMethod === PaymentMethod.BANK_TRANSFER
                      }
                      onChange={(e) =>
                        setSelectedPaymentMethod(
                          e.target.value as PaymentMethod
                        )
                      }
                      className="mr-3"
                    />
                    <span>계좌이체</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PaymentMethod.VIRTUAL_ACCOUNT}
                      checked={
                        selectedPaymentMethod === PaymentMethod.VIRTUAL_ACCOUNT
                      }
                      onChange={(e) =>
                        setSelectedPaymentMethod(
                          e.target.value as PaymentMethod
                        )
                      }
                      className="mr-3"
                    />
                    <span>무통장입금</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PaymentMethod.TOSS}
                      checked={selectedPaymentMethod === PaymentMethod.TOSS}
                      onChange={(e) =>
                        setSelectedPaymentMethod(
                          e.target.value as PaymentMethod
                        )
                      }
                      className="mr-3"
                    />
                    <span>토스</span>
                  </label>
                </div>
              </div>

              {/* 결제 약관 */}
              <div className="mb-6 p-3 bg-gray-50 rounded text-xs text-gray-600">
                <p>• 결제 완료 후 예약이 확정됩니다.</p>
                <p>• 취소/환불 정책에 따라 수수료가 발생할 수 있습니다.</p>
                <p>
                  • 체크인 3일 전까지 100% 환불, 1-2일 전 50% 환불, 당일 환불
                  불가
                </p>
              </div>

              {/* 결제 버튼 */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                  disabled={isProcessingPayment}
                >
                  취소
                </button>
                <button
                  onClick={processReservationAndPayment}
                  disabled={isProcessingPayment}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingPayment
                    ? "결제 중..."
                    : `₩${(
                        finalAmount || totalPrice
                      ).toLocaleString()} 결제하기`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
