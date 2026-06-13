import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div>
      <nav className={styles.nav}>
        <div className={styles.logo}>ward<span>robe</span></div>
        <div className={styles.navLinks}>
          <NavLink to="/" end className={({ isActive }) => isActive ? `${styles.navTab} ${styles.active}` : styles.navTab}>
            My clothes
          </NavLink>
          <NavLink to="/schedule" className={({ isActive }) => isActive ? `${styles.navTab} ${styles.active}` : styles.navTab}>
            Schedule
          </NavLink>
          <NavLink to="/today" className={({ isActive }) => isActive ? `${styles.navTab} ${styles.active}` : styles.navTab}>
            Today
          </NavLink>
        </div>
        <div className={styles.userArea}>
          <span className={styles.userName}>{user?.name}</span>
          <button className="btn btn-sm" onClick={handleLogout}>Log out</button>
        </div>
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
