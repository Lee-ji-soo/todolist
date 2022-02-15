module.exports = {
  isEmail: (value) => {
    let isOk = true;
    const hasSpace = /\s/g;
    const onlyOneAt = value.split("@").length === 2;
    const isFirstLetterHypoon = value.split('')[0] === '-';
    if (
      value.length < 9 ||
      value.match(hasSpace) ||
      !onlyOneAt ||
      isFirstLetterHypoon
    ) {
      isOk = false;
    }
    return isOk;
  },
};
