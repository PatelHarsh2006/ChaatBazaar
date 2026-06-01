(() => {
  const setHeroHeaderOffset = () => {
    const header = document.querySelector("header");
    const height = header ? header.offsetHeight : 90;
    document.documentElement.style.setProperty("--header-height", `${height}px`);
  };

  setHeroHeaderOffset();
  window.addEventListener("resize", setHeroHeaderOffset);

  const videos = Array.from(document.querySelectorAll(".hero-bg-video"));
  if (videos.length < 2) return;

  const sources = [
    "videos/food-preparation.mp4",
    "videos/food-prep.mp4",
    "videos/friends-1.mp4",
    "videos/friends-2.mp4",
  ];

  let currentIndex = 0;
  let activeVideo = 0;

  videos[0].src = sources[0];
  videos[0].play().catch(() => {});

  const prepareVideo = (video, source) => {
    if (!video.src.endsWith(source)) {
      video.src = source;
      video.load();
    }
    video.currentTime = 0;
    return video.play().catch(() => {});
  };

  const showNextVideo = async () => {
    const nextIndex = (currentIndex + 1) % sources.length;
    const nextVideo = videos[1 - activeVideo];
    const currentVideo = videos[activeVideo];

    await prepareVideo(nextVideo, sources[nextIndex]);

    nextVideo.classList.add("active");
    currentVideo.classList.remove("active");

    currentIndex = nextIndex;
    activeVideo = 1 - activeVideo;
  };

  window.setInterval(showNextVideo, 6000);
})();
