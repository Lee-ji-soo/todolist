module.exports = {
  isEmail: (value) => {
      // value가 이메일 형식에 맞으면 true, 형식에 맞지 않으면 false를 return 하도록 구현해보세요
      if(value.split("@").length !== 2){
        return false;
      } else if(value.includes(" ")){
        return false;
      } else if(value[0] === "-"){
        return false;
      }
        return true;
  },
};