const { isEmail } = require("./validation");

test("글자가 9자 이상이어야 합니다.", () => {
  expect(isEmail("123456@78910")).toEqual(true);
  expect(isEmail("123456@78911")).toEqual(true);
  expect(isEmail("123@")).toEqual(false);
});

test("글자에 공백이 없어야 합니다.", () => {
  expect(isEmail("12345678 @910")).toEqual(false);
  expect(isEmail("123456@78911")).toEqual(true);
  expect(isEmail("12  @3")).toEqual(false);
});

test("글자에 @가 하나만 있어야 합니다.", () => {
  expect(isEmail("12345678@910")).toEqual(true);
  expect(isEmail("1234567@@8911")).toEqual(false);
  expect(isEmail("12@@@@3")).toEqual(false);
});

test("맨 앞글자에 -가 있으면 안됩니다.", () => {
  expect(isEmail("12345678@910")).toEqual(true);
  expect(isEmail("-1234567@8911")).toEqual(false);
  expect(isEmail("1234567@31234567")).toEqual(true);
});