type CediahLogoProps = {
  className?: string;
  priority?: boolean;
  sizes?: string;
  variant?: "dark" | "light";
};

export function CediahLogo({ className = "", variant = "dark" }: CediahLogoProps) {
  const stemColor = variant === "light" ? "#FFFFFF" : "#0B1F3D";

  return (
    <span
      aria-label="KORAS"
      className={`cediah-logo cediah-logo-${variant} ${className}`.trim()}
      role="img"
    >
      <svg
        aria-hidden="true"
        className="koras-logo-mark koraz-logo-mark"
        viewBox="0 0 1254 1254"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="290" y="210" width="245" height="820" rx="122.5" fill={stemColor} />
        <path
          d="M 805,210 L 820,210 L 835,207 L 850,207 L 865,210 L 880,216 L 895,222 L 910,231 L 925,240 L 940,255 L 949,270 L 958,285 L 964,300 L 967,315 L 970,330 L 970,345 L 970,360 L 967,375 L 961,390 L 955,405 L 946,420 L 934,435 L 919,447 L 904,459 L 889,468 L 874,474 L 859,477 L 844,480 L 829,480 L 814,480 L 799,480 L 784,483 L 769,483 L 754,489 L 739,492 L 724,498 L 709,507 L 694,519 L 679,534 L 667,549 L 658,564 L 652,579 L 646,594 L 643,609 L 643,624 L 643,639 L 646,654 L 652,669 L 661,684 L 670,699 L 682,714 L 697,726 L 712,738 L 727,744 L 742,750 L 757,756 L 772,759 L 787,759 L 802,759 L 817,759 L 832,759 L 847,759 L 862,762 L 877,768 L 892,774 L 907,783 L 922,792 L 937,807 L 949,822 L 955,837 L 961,852 L 967,867 L 970,882 L 970,897 L 970,912 L 967,927 L 964,942 L 958,957 L 949,972 L 937,987 L 922,1002 L 907,1014 L 892,1023 L 877,1029 L 862,1035 L 847,1038 L 832,1038 L 817,1038 L 802,1035 L 787,1032 L 772,1026 L 757,1020 L 742,1008 L 727,996 L 712,981 L 703,966 L 697,951 L 691,936 L 685,921 L 685,906 L 682,891 L 679,876 L 676,861 L 673,846 L 667,831 L 661,816 L 652,801 L 637,786 L 625,774 L 610,759 L 595,750 L 580,741 L 565,732 L 550,723 L 535,717 L 520,711 L 505,699 L 490,687 L 478,672 L 472,657 L 466,642 L 463,627 L 466,612 L 469,597 L 475,582 L 484,567 L 496,552 L 511,540 L 526,531 L 541,522 L 556,516 L 571,507 L 586,498 L 601,489 L 616,480 L 631,468 L 646,453 L 661,438 L 673,423 L 679,408 L 685,393 L 691,378 L 694,363 L 694,348 L 697,333 L 700,318 L 703,303 L 709,288 L 718,273 L 730,258 L 745,243 L 760,231 L 775,222 L 790,216 Z"
          fill="#0A8EFE"
        />
      </svg>
      <span className="koras-logo-copy koraz-logo-copy">
        <strong>KORAS</strong>
      </span>
    </span>
  );
}
