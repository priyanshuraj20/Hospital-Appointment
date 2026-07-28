import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Routers from "../routes/Routers";

const Layout = () => {
  return (
    <div>
      <Header />
      <main className="min-h-[75vh]">
        <Routers />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
