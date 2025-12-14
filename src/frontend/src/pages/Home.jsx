import BackgroundAnimation from "@/components/Common/BackgroundAnimation/BackgroundAnimation"
import Navbar from "@/components/Layout/Navbar/Navbar"
import HomePage from "@/pages/Public/Home/Home"

const Home = () => (
  <div className="container">
    <BackgroundAnimation />
    <Navbar />
    <HomePage />
  </div>
)

export default Home