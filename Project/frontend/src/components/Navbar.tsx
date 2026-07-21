import "./Navbar.css";

function Navbar() {
  return (
    <header className="navbar">
      <nav className="navbar-menu">
        <a href="#">매칭</a>
        <a href="#">모집글</a>
        <a href="#">문의</a>
      </nav>
      <div className="navbar-auth">
        <button className="navbar-auth-link">로그인</button>
      </div>
      
    </header>
  );
}

export default Navbar;
