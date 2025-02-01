import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Wallet from "@/components/WalletGenerator";
import WalletGenerator from "@/components/WalletGenerator";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <Navbar />
      <Wallet/>
      <Footer />
    </div>
  );
}