module.exports = function (url, dimensions, destination) {
  return {
    render: {
      src: `https://graphics.wsj.com/dynamic-inset-iframer/?url=https://asset.wsj.net/wsjnewsgraphics/dice/${destination}/inset.json`,
    },
    text: null,
    link: '#',
    picture: {
      sources: [
        {
          media: '4u',
          srcset: url,
          width: dimensions.width,
          height: dimensions.height,
        },
      ],
      img: {
        src: url,
        type: 'graphic',
        width: dimensions.width,
        height: dimensions.height,
      },
    },
  };
};
