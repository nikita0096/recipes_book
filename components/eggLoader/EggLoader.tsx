import styles from './EggLoader.module.css';

const EggLoader = () => {
  return (
    <div className={styles.wrapper}>
      <svg
        viewBox="0 0 160 120"
        width="140"
        height="80"
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
      >
        <defs>
          <radialGradient id="eggG" cx="50%" cy="40%" r="60%">
            <stop offset="0%"   stopColor="#FFFEF6"/>
            <stop offset="60%"  stopColor="#F0EAD0"/>
            <stop offset="100%" stopColor="#DDD0A8"/>
          </radialGradient>
          <radialGradient id="yolkG" cx="36%" cy="30%" r="62%">
            <stop offset="0%"   stopColor="#FFE566"/>
            <stop offset="50%"  stopColor="#FFB800"/>
            <stop offset="100%" stopColor="#D97000"/>
          </radialGradient>
          <filter id="yolkF">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.28"/>
          </filter>

          <clipPath id="leftClip">
            <polygon points="-20,-20 80,-20 80,20 90,29 70,38 90,47 70,56 80,65 80,72 -20,72"/>
          </clipPath>
          <clipPath id="rightClip">
            <polygon points="180,-20 80,-20 80,20 90,29 70,38 90,47 70,56 80,65 80,72 180,72"/>
          </clipPath>
          <clipPath id="leftBottom">
            <rect x="-20" y="71" width="102" height="20"/>
          </clipPath>
          <clipPath id="rightBottom">
            <rect x="78" y="71" width="102" height="20"/>
          </clipPath>
        </defs>

        {/* Белок + желток */}
        <g className={styles.eggContent}>
          <path
            d="M 80,27 C 94,26 106,31 110,39 C 114,47 110,57 104,61
               C 99,65 91,63 85,62 C 80,61 76,63 69,62
               C 59,60 52,53 53,45 C 52,36 58,29 67,26
               C 71,24 76,26 80,27 Z"
            fill="rgba(255,255,248,0.93)"
          />
          <circle cx="80" cy="46" r="15" fill="url(#yolkG)" filter="url(#yolkF)"/>
          <ellipse cx="74" cy="40" rx="4.5" ry="2.8"
                   fill="rgba(255,255,200,0.55)" transform="rotate(-20,74,40)"/>
        </g>

        {/* Правая половина скорлупы */}
        <g className={styles.shellRight}>
          <ellipse cx="80" cy="46" rx="42" ry="26" fill="url(#eggG)" clipPath="url(#rightClip)"/>
          <ellipse cx="80" cy="46" rx="42" ry="26" fill="url(#eggG)" clipPath="url(#rightBottom)"/>
        </g>

        {/* Левая половина скорлупы */}
        <g className={styles.shellLeft}>
          <ellipse cx="80" cy="46" rx="46" ry="26" fill="url(#eggG)" clipPath="url(#leftClip)"/>
          <ellipse cx="80" cy="46" rx="46" ry="26" fill="url(#eggG)" clipPath="url(#leftBottom)"/>
          <ellipse cx="58" cy="34" rx="9" ry="4.5"
                   fill="rgba(255,255,255,0.26)" transform="rotate(-18,58,34)"
                   clipPath="url(#leftClip)"/>
        </g>
      </svg>
    </div>
  );
};

export default EggLoader;
