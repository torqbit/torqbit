import { FC } from "react";

import styles from "@/styles/Marketing/LandingPage/LandingPage.module.scss";
import { Space } from "antd";
import Link from "next/link";
import { Theme, User } from "@prisma/client";
import Image from "next/image";
import { useAppContext } from "@/components/ContextApi/AppContext";

const MarketingHero: FC<{ isMobile: boolean; user: User }> = ({ isMobile, user }) => {
  const { globalState } = useAppContext();
  return (
    <>
      <div className={styles.heroContentContainer}>
        <h1>
          Become a <del>Coder</del>
          <br /> Product Builder
        </h1>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Asperiores rerum voluptatum perferendis autem
          veritatis nostrum. Libero aliquam dignissimos sunt voluptatum!
        </p>

        <Space size={"large"} style={{ marginBottom: 50 }}>
          <Link href={`/login`} className={styles.btn__signup}>
            {user ? "Go to Dashboard" : " Sign up for free"}
          </Link>
          <a className={styles.btn__contact} href="mailto:support@torqbit.com" aria-label="Contact us through mail">
            Contact Us
          </a>
        </Space>
        <Image
          alt="Website builder screenshot"
          height={625}
          width={1200}
          loading="lazy"
          src={`/img/${globalState.theme === Theme.dark ? "macbook-dark.png" : "macbook-light.png"}`}
        />
      </div>
      <div className={styles.hero_img_bg}></div>
    </>
  );
};

export default MarketingHero;
