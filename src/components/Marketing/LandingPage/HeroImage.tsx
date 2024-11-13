import { FC } from "react";
import styles from "@/styles/Marketing/LandingPage/LandingPage.module.scss";
import Image from "next/image";
import MediaQuery from "react-responsive";
import { useAppContext } from "@/components/ContextApi/AppContext";
import { Theme } from "@prisma/client";

const HeroImage: FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const { globalState } = useAppContext();

  return (
    <section className={styles.hero__img}>
      <MediaQuery maxWidth={430}>
        <Image
          alt="Website builder screenshot"
          height={218}
          width={350}
          loading="lazy"
          src={`/img/${globalState.theme === Theme.dark ? "macbook-dark.png" : "macbook-light.png"}`}
        />
      </MediaQuery>

      <MediaQuery minWidth={1200}>
        <Image
          alt="Website builder screenshot"
          height={625}
          width={1200}
          loading="lazy"
          src={`/img/${globalState.theme === Theme.dark ? "macbook-dark.png" : "macbook-light.png"}`}
        />
      </MediaQuery>
    </section>
  );
};

export default HeroImage;
