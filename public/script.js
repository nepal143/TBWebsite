let list = document.getElementsByClassName("navLink-tab");
const OnClickNav = (i)=>{
  for(let j = 0 ; j < list.length ; j++) {
    list[j].classList.remove("active"); 
  }
  list[i].classList.add("active"); 
}