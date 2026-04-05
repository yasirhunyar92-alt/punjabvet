import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { isUrdu } = useLanguage();
  const f = isUrdu ? 'font-urdu' : '';

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-muted/30">
      <div className="text-center px-4">
        <p className="text-7xl font-extrabold text-primary mb-3">404</p>
        <h1 className={`text-xl font-bold text-foreground mb-2 ${f}`}>
          {isUrdu ? 'صفحہ نہیں ملا' : 'Page Not Found'}
        </h1>
        <p className={`text-sm text-muted-foreground mb-6 max-w-sm mx-auto ${f}`}>
          {isUrdu
            ? 'معذرت، آپ جو صفحہ تلاش کر رہے ہیں وہ موجود نہیں ہے یا ہٹا دیا گیا ہے۔'
            : 'Sorry, the page you are looking for doesn\'t exist or has been moved.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button className={f}>
              <Home size={16} className="mr-2" />
              {isUrdu ? 'ہوم پیج' : 'Go Home'}
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" className={f}>
              {isUrdu ? 'مصنوعات دیکھیں' : 'Browse Products'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
