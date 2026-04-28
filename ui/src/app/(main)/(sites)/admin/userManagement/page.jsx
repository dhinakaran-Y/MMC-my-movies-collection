import { UserDashboard } from "./userDashboard";
import { cookies } from "next/headers";

export const metadata = {
  title: {
    title: "userManagement",
    template: "%s | MMC",
  },
  description: "this page is the user management for admin in MMC",
};

async function fetchUserList(token) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        cookie: `token=${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`${res.status}, Fetch error in userList getting`);
    }

    const data = await res.json();
    return data
  } catch (error) {
    console.error(error);
    return [];
  }
};

export default async function UserManagement() {

  // get the  cookie & extract token
  const storedCookie = await cookies();
  const token = storedCookie.get("token")?.value;
  
  // fetch userList
  const userList = await fetchUserList(token)
  // console.log(userList);
  
  
  return (
    <>
    <UserDashboard userList={userList}/>
    </>
  );
}
