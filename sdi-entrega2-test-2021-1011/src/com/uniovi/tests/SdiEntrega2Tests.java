package com.uniovi.tests;

//Paquetes Java
import java.util.List;
//Paquetes JUnit 
import org.junit.*;
import org.junit.runners.MethodSorters;
import static org.junit.Assert.assertTrue;
//Paquetes Selenium 
import org.openqa.selenium.*;
import org.openqa.selenium.firefox.*;
//Paquetes Utilidades de Testing Propias
import com.uniovi.tests.util.SeleniumUtils;
//Paquetes con los Page Object
import com.uniovi.tests.pageobjects.*;

//Ordenamos las pruebas por el nombre del mÃ©todo
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class SdiEntrega2Tests {

	static String PathFirefox65 = "C:\\Program Files\\Mozilla Firefox\\firefox.exe";
	static String Geckdriver024 = "C:\\Users\\Moises\\Desktop\\UNIVERSIDAD\\TERCERO\\"
			+ "2 CUATRIMESTRE\\SDI\\Laboratorio\\PL5\\PL-SDI-Sesión5-material\\geckodriver024win64.exe";

	static WebDriver driver = getDriver(PathFirefox65, Geckdriver024);
	static String URL = "http://localhost:8081";

	public static WebDriver getDriver(String PathFirefox, String Geckdriver) {
		System.setProperty("webdriver.firefox.bin", PathFirefox);
		System.setProperty("webdriver.gecko.driver", Geckdriver);
		WebDriver driver = new FirefoxDriver();
		return driver;
	}

	@Before
	public void setUp() {
		
		// Limpiamos la base de datos
		driver.navigate().to(URL + "/bd/limpiar");
		
		// Introducimos datos de prueba 
		driver.navigate().to(URL + "/bd/prueba");
		
		// Vamos a la URL principal
		driver.navigate().to(URL);
	}

	@After
	public void tearDown() {
		driver.manage().deleteAllCookies();
	}

	@BeforeClass
	static public void begin() {
		// Configuramos las pruebas.
		// Fijamos el timeout en cada opción de carga de una vista. 3 segundos.
		PO_View.setTimeout(3);
	}

	@AfterClass
	static public void end() {
		// Cerramos el navegador al finalizar las pruebas
		driver.quit();
	}

	// PR01. Registro de Usuario con datos válidos. /
	@Test
	public void PR01() {
		// Vamos al formulario de registro
		PO_NavView.clickOption(driver, "/signup", "text", "Registrar usuario");

		// Rellenamos el formulario con datos validos
		PO_RegisterView.fillForm(driver, "pueba@email.com", "prueba", "prueba", "123456", "123456");
		PO_View.checkElement(driver, "text", "pueba@email.com");
		PO_View.checkElement(driver, "text", "100 Є");
		PO_View.checkElement(driver, "text", "¡ Bienvenido prueba !");

		// Hacemos logout
		PO_NavView.logOut(driver);
	}

	// PR02. Registro de Usuario con datos inválidos (email, nombre y apellidos
	// vacíos). /
	@Test
	public void PR02() {
		// Vamos al formulario de registro
		PO_NavView.clickOption(driver, "/signup", "text", "Registrar usuario");

		// Rellenamos el formulario dejando uno de los campos vacíos

		// Email vacío
		PO_RegisterView.fillForm(driver, "", "prueba", "prueba", "123456", "123456");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");

		// Nombre vacío
		PO_RegisterView.fillForm(driver, "pueba@email.com", "", "prueba", "123456", "123456");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");

		// Apellidos vacío
		PO_RegisterView.fillForm(driver, "pueba@email.com", "prueba", "", "123456", "123456");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");

		// Contraseá vacía
		PO_RegisterView.fillForm(driver, "pueba@email.com", "prueba", "prueba", "", "123456");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");

		// Confirmación de contraseña vacía
		PO_RegisterView.fillForm(driver, "pueba@email.com", "prueba", "prueba", "123456", "");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");

		// Rellenamos el formulario dejando todos los campos vacíos
		PO_RegisterView.fillForm(driver, "", "", "", "", "");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");

	}

	// PR03. Registro de Usuario con datos inválidos (repetición de contraseña
	// inválida). /
	@Test
	public void PR03() {
		// Vamos al formulario de registro
		PO_NavView.clickOption(driver, "/signup", "text", "Registrar usuario");

		// Rellenamos el formulario con contraseñas que no coinciden
		PO_RegisterView.fillForm(driver, "pueba2@email.com", "prueba", "prueba", "123456", "1234567");
		PO_View.checkElement(driver, "text", "Las contraseñas no coinciden");

	}

	// PR04. Registro de Usuario con datos inválidos (email existente). /
	@Test
	public void PR04() {
		// Vamos al formulario de registro
		PO_NavView.clickOption(driver, "/signup", "text", "Registrar usuario");

		// Rellenamos el formulario con datos váldos y con el email de un usuario
		// existente
		PO_RegisterView.fillForm(driver, "moises@email.com", "prueba2", "prueba2", "123456", "123456");
		PO_View.checkElement(driver, "text", "El email introducido ya está en uso");
	}

	// PR05. Inicio de sesión con datos válidos. /
	@Test
	public void PR05() {
		// Vamos al formulario de identificacion
		PO_NavView.clickOption(driver, "/login", "text", "Identificación de usuario");

		// Rellenamos el formulario con un usuario válido existente
		PO_LoginView.fillForm(driver, "moises@email.com", "123456");
		PO_View.checkElement(driver, "text", "moises@email.com");
		PO_View.checkElement(driver, "text", "100 Є");
		PO_View.checkElement(driver, "text", "¡ Bienvenido Moisés !");

		// Cerramos sesión
		PO_NavView.logOut(driver);
	}

	// PR06. Inicio de sesión con datos inválidos (email existente, pero contraseña
	// incorrecta). /
	@Test
	public void PR06() {
		// Vamos al formulario de identificacion
		PO_NavView.clickOption(driver, "/login", "text", "Identificación de usuario");

		// Rellenamos el formulario con un email existente pero con una 
		// contraseña incorrecta 
		PO_LoginView.fillForm(driver, "pueba@email.com", "1234567");
		PO_View.checkElement(driver, "text", "Email incorrecto o contraseña incorrecta");

	}

	// PR07. Inicio de sesión con datos inválidos (campo email o contraseña vacíos).
	// /
	@Test
	public void PR07() {
		// Vamos al formulario de identificacion
		PO_NavView.clickOption(driver, "/login", "text", "Identificación de usuario");

		// Rellenamos el formulario dejando uno de los campos en blanco

		// Dejamos el email en blanco
		PO_LoginView.fillForm(driver, "", "123456");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");

		// Dejamos la contraseña en blanco
		PO_LoginView.fillForm(driver, "pueba@email.com", "");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");

		// Rellenamos el formulario dejando todos los campos en blanco
		PO_LoginView.fillForm(driver, "", "");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");

	}

	// PR08. Inicio de sesión con datos inválidos (email no existente en la
	// aplicación). /
	@Test
	public void PR08() {
		// Vamos al formulario de identificacion
		PO_NavView.clickOption(driver, "/login", "text", "Identificación de usuario");

		// Rellenamos el formulario con un email inexistente en la aplicación
		PO_LoginView.fillForm(driver, "pueba9999999@email.com", "123456");
		PO_View.checkElement(driver, "text", "Email incorrecto o contraseña incorrecta");
	}

	// PR09. Hacer click en la opción de salir de sesión y comprobar que se redirige
	// a la página de
	// inicio de sesión (Login). /
	@Test
	public void PR09() {

		// Vamos al formulario de identificacion
		PO_NavView.clickOption(driver, "/login", "text", "Identificación de usuario");

		// Rellenamos el formulario con un usuario válido existente
		PO_LoginView.fillForm(driver, "moises@email.com", "123456");
		PO_View.checkElement(driver, "text", "moises@email.com");

		// Cerramos sesión y comprobamos que nos redirige a la página de login
		PO_NavView.logOut(driver);
		PO_View.checkElement(driver, "text", "Identificación de usuario");

	}

	// PR10. Comprobar que el botón cerrar sesión no está visible si el usuario no
	// está autenticado. /
	@Test
	public void PR10() {
		SeleniumUtils.textoNoPresentePagina(driver, "Desconectar");
	}

	// PR11. Mostrar el listado de usuarios y comprobar que se muestran todos los que existen en el 
	// sistema. /
	@Test
	public void PR11() {
		
		// Vamos al formulario de identificacion
		PO_NavView.clickOption(driver, "/login", "text", "Identificación de usuario");

		// Iniciamos sesión como administrador
		PO_LoginView.fillForm(driver, "admin@email.com", "admin");

		// Comprobamos que se muestran todos los usuarios
		List<WebElement> elements = PO_View.checkElement(driver, "free", "//*[@id=\"tableUsers\"]/tbody/tr");
		assertTrue(elements.size() == 1);
		PO_View.checkElement(driver, "text", "moises@email.com");

		// Cerramos sesión y comprobamos que nos redirige a la página de login
		PO_NavView.logOut(driver);
		PO_View.checkElement(driver, "text", "Identificación de usuario");
	}

	// PR12. Sin hacer /
	@Test
	public void PR12() {
		assertTrue("PR12 sin hacer", false);
	}

	// PR13. Sin hacer /
	@Test
	public void PR13() {
		assertTrue("PR13 sin hacer", false);
	}

	// PR14. Sin hacer /
	@Test
	public void PR14() {
		assertTrue("PR14 sin hacer", false);
	}

	// PR15. Sin hacer /
	@Test
	public void PR15() {
		assertTrue("PR15 sin hacer", false);
	}

	// PR16. Sin hacer /
	@Test
	public void PR16() {
		assertTrue("PR16 sin hacer", false);
	}

	// PR017. Sin hacer /
	@Test
	public void PR17() {
		assertTrue("PR17 sin hacer", false);
	}

	// PR18. Sin hacer /
	@Test
	public void PR18() {
		assertTrue("PR18 sin hacer", false);
	}

	// PR19. Sin hacer /
	@Test
	public void PR19() {
		assertTrue("PR19 sin hacer", false);
	}

	// P20. Sin hacer /
	@Test
	public void PR20() {
		assertTrue("PR20 sin hacer", false);
	}

	// PR21. Sin hacer /
	@Test
	public void PR21() {
		assertTrue("PR21 sin hacer", false);
	}

	// PR22. Sin hacer /
	@Test
	public void PR22() {
		assertTrue("PR22 sin hacer", false);
	}

	// PR23. Sin hacer /
	@Test
	public void PR23() {
		assertTrue("PR23 sin hacer", false);
	}

	// PR24. Sin hacer /
	@Test
	public void PR24() {
		assertTrue("PR24 sin hacer", false);
	}

	// PR25. Sin hacer /
	@Test
	public void PR25() {
		assertTrue("PR25 sin hacer", false);
	}

	// PR26. Sin hacer /
	@Test
	public void PR26() {
		assertTrue("PR26 sin hacer", false);
	}

	// PR27. Sin hacer /
	@Test
	public void PR27() {
		assertTrue("PR27 sin hacer", false);
	}

	// PR029. Sin hacer /
	@Test
	public void PR29() {
		assertTrue("PR29 sin hacer", false);
	}

	// PR030. Sin hacer /
	@Test
	public void PR30() {
		assertTrue("PR30 sin hacer", false);
	}

	// PR031. Sin hacer /
	@Test
	public void PR31() {
		assertTrue("PR31 sin hacer", false);
	}

}
