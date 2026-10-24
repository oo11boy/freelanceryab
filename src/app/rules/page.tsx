export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-center">قوانین و مقررات</h1>
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-bold text-lg mb-2">۱. قوانین عمومی</h2>
          <p className="text-gray-600 leading-relaxed">
            استفاده از این پلتفرم به معنای پذیرش تمامی قوانین و مقررات است.
          </p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-bold text-lg mb-2">۲. محتوای مجاز</h2>
          <p className="text-gray-600 leading-relaxed">
            تمامی خدمات ارائه شده باید در چارچوب قوانین جمهوری اسلامی ایران باشد.
          </p>
        </div>
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-bold text-lg mb-2">۳. مسئولیت کاربران</h2>
          <p className="text-gray-600 leading-relaxed">
            کاربران مسئول صحت اطلاعات وارد شده و انجام تعهدات خود هستند.
          </p>
        </div>
      </div>
    </div>
  );
}