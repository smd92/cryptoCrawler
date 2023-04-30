interface User {
    name: string;
    id: number;
  }

  interface Date {
    name: string;
    id: number;
  }

  const user: User = {
    name: "Hayes",
    id: 0,
  };

const message = "adsaskdkl";

function test(user: User, date: Date){
    return user.name + date.name;
}