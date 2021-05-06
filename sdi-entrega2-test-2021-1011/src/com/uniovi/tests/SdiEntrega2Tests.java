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
		driver.navigate().to(URL + "/bd/clear");

		// Introducimos datos de prueba
		driver.navigate().to(URL + "/bd/insertSampleData");

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
		// Rellenamos el formulario con un usuario válido existente
		PO_NavView.logInAs(driver, "moises@email.com", "123456");
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
		// Rellenamos el formulario con un email existente pero con una
		// contraseña incorrecta
		PO_NavView.logInAs(driver, "moises@email.com", "1234567");
		PO_View.checkElement(driver, "text", "Email incorrecto o contraseña incorrecta");
	}

	// PR07. Inicio de sesión con datos inválidos (campo email o contraseña vacíos).
	// /
	@Test
	public void PR07() {
		// Rellenamos el formulario dejando uno de los campos en blanco

		// Dejamos el email en blanco
		PO_NavView.logInAs(driver, "", "123456");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");

		// Dejamos la contraseña en blanco
		PO_NavView.logInAs(driver, "pueba@email.com", "");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");

		// Rellenamos el formulario dejando todos los campos en blanco
		PO_NavView.logInAs(driver, "", "");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");
	}

	// PR08. Inicio de sesión con datos inválidos (email no existente en la
	// aplicación). /
	@Test
	public void PR08() {
		// Rellenamos el formulario con un email inexistente en la aplicación
		PO_NavView.logInAs(driver, "pueba9999999@email.com", "123456");
		PO_View.checkElement(driver, "text", "Email incorrecto o contraseña incorrecta");
	}

	// PR09. Hacer click en la opción de salir de sesión y comprobar que se redirige
	// a la página de inicio de sesión (Login). /
	@Test
	public void PR09() {
		// Iniciamos sesión como usuario estándar
		PO_NavView.logInAs(driver, "moises@email.com", "123456");

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

	// PR11. Mostrar el listado de usuarios y comprobar que se muestran todos los
	// que existen en el
	// sistema. /
	@Test
	public void PR11() {
		// Iniciamos sesión como usuario estándar
		PO_NavView.logInAs(driver, "admin@email.com", "admin");

		// Comprobamos que se muestran todos los usuarios
		List<WebElement> elements = PO_View.checkElement(driver, "free", "//*[@id=\"tableUsers\"]/tbody/tr");
		assertTrue(elements.size() == 5);
		PO_View.checkElement(driver, "text", "andrea@email.com");
		PO_View.checkElement(driver, "text", "juan@email.com");
		PO_View.checkElement(driver, "text", "manolo@email.com");
		PO_View.checkElement(driver, "text", "moises@email.com");
		PO_View.checkElement(driver, "text", "pepe@email.com");

		// Cerramos sesión y comprobamos que nos redirige a la página de login
		PO_NavView.logOut(driver);
	}

	// PR12. Ir a la lista de usuarios, borrar el primer usuario de la lista,
	// comprobar que la lista se actualiza y dicho usuario desaparece. /
	@Test
	public void PR12() {
		// Iniciamos sesión como usuario estándar
		PO_NavView.logInAs(driver, "admin@email.com", "admin");

		// Seleccionamos el primer usuario que aparece
		List<WebElement> elements = PO_View.checkElement(driver, "free",
				"//*[@id=\"tableUsers\"]/tbody/tr/td[4]/input");
		assertTrue(elements.size() == 5);
		elements.get(0).click();

		// Damos al botón correspondiente para eliminar a los usuarios seleccionados
		elements = PO_View.checkElement(driver, "id", "buttonDelete");
		assertTrue(elements.size() == 1);
		elements.get(0).click();

		// Comprobamos que el usuario ya no esta en la tabla
		elements = PO_View.checkElement(driver, "free", "//*[@id=\"tableUsers\"]/tbody/tr");
		assertTrue(elements.size() == 4);
		PO_View.checkElement(driver, "text", "juan@email.com");
		PO_View.checkElement(driver, "text", "manolo@email.com");
		PO_View.checkElement(driver, "text", "moises@email.com");
		PO_View.checkElement(driver, "text", "pepe@email.com");
		SeleniumUtils.textoNoPresentePagina(driver, "andrea@email.com");

		// Cerramos sesión y comprobamos que nos redirige a la página de login
		PO_NavView.logOut(driver);
	}

	// PR13. Ir a la lista de usuarios, borrar el último usuario de la lista,
	// comprobar que la lista se
	// actualiza y dicho usuario desaparece /
	@Test
	public void PR13() {
		// Iniciamos sesión como usuario estándar
		PO_NavView.logInAs(driver, "admin@email.com", "admin");

		// Seleccionamos el último usuario que aparece
		List<WebElement> elements = PO_View.checkElement(driver, "free",
				"//*[@id=\"tableUsers\"]/tbody/tr/td[4]/input");
		assertTrue(elements.size() == 5);
		elements.get(elements.size() - 1).click();

		// Damos al botón correspondiente para eliminar a los usuarios seleccionados
		elements = PO_View.checkElement(driver, "id", "buttonDelete");
		assertTrue(elements.size() == 1);
		elements.get(0).click();

		// Comprobamos que el usuario ya no esta en la tabla
		elements = PO_View.checkElement(driver, "free", "//*[@id=\"tableUsers\"]/tbody/tr");
		assertTrue(elements.size() == 4);
		PO_View.checkElement(driver, "text", "andrea@email.com");
		PO_View.checkElement(driver, "text", "juan@email.com");
		PO_View.checkElement(driver, "text", "manolo@email.com");
		PO_View.checkElement(driver, "text", "moises@email.com");
		SeleniumUtils.textoNoPresentePagina(driver, "pepe@email.com");

		// Cerramos sesión y comprobamos que nos redirige a la página de login
		PO_NavView.logOut(driver);
	}

	// PR14. Ir a la lista de usuarios, borrar 3 usuarios, comprobar que la lista se
	// actualiza y dichos
	// usuarios desaparecen. /
	@Test
	public void PR14() {
		// Iniciamos sesión como usuario estándar
		PO_NavView.logInAs(driver, "admin@email.com", "admin");

		// Seleccionamos los 3 de los usuarios que aparecen
		List<WebElement> elements = PO_View.checkElement(driver, "free",
				"//*[@id=\"tableUsers\"]/tbody/tr/td[4]/input");
		assertTrue(elements.size() == 5);
		elements.get(1).click();
		elements.get(2).click();
		elements.get(3).click();

		// Damos al botón correspondiente para eliminar a los usuarios seleccionados
		elements = PO_View.checkElement(driver, "id", "buttonDelete");
		assertTrue(elements.size() == 1);
		elements.get(0).click();

		// Comprobamos qu eel usuario ya no esta en la tabla
		elements = PO_View.checkElement(driver, "free", "//*[@id=\"tableUsers\"]/tbody/tr");
		assertTrue(elements.size() == 2);
		PO_View.checkElement(driver, "text", "andrea@email.com");
		PO_View.checkElement(driver, "text", "pepe@email.com");
		SeleniumUtils.textoNoPresentePagina(driver, "juan@email.com");
		SeleniumUtils.textoNoPresentePagina(driver, "manolo@email.com");
		SeleniumUtils.textoNoPresentePagina(driver, "moises@email.com");

		// Cerramos sesión y comprobamos que nos redirige a la página de login
		PO_NavView.logOut(driver);
	}

	// PR15. Ir al formulario de alta de oferta, rellenarla con datos válidos y
	// pulsar el botón Submit. Comprobar que la oferta sale en el listado de ofertas
	// de dicho usuario
	@Test
	public void PR15() {
		// Iniciamos sesión como usuario estándar
		PO_NavView.logInAs(driver, "manolo@email.com", "123456");

		// Ir a la opcion de dar de alta una nota
		PO_NavView.displayOffersMenu(driver, "/standard/offer/add");

		// Rellenamos el formulario de alta de oferta con datos validos
		PO_AddOfferView.fillForm(driver, "PruebaTitulo", "PruebaDescripcion", "0.21");

		// Comprobamos que la oferta recien añadida sale en la lista de ofertas propias
		// del usuario
		PO_View.checkElement(driver, "text", "PruebaTitulo");
		PO_View.checkElement(driver, "text", "PruebaDescripcion");
		PO_View.checkElement(driver, "text", "0.21");

		// Cerramos sesión y comprobamos que nos redirige a la página de login
		PO_NavView.logOut(driver);
	}

	// PR16. Ir al formulario de alta de oferta, rellenarla con datos inválidos
	// (campo título vacío y
	// precio en negativo) y pulsar el botón Submit. Comprobar que se muestra el
	// mensaje de campo
	// obligatorio. /
	@Test
	public void PR16() {
		// Iniciamos sesión como usuario estándar
		PO_NavView.logInAs(driver, "moises@email.com", "123456");

		// Ir a la opcion de dar de alta una nota
		PO_NavView.displayOffersMenu(driver, "/standard/offer/add");

		// Rellenamos el formulario de alta de oferta dejando algún campo vacío

		// Título vacío
		PO_AddOfferView.fillForm(driver, "", "PruebaDescripcion", "0.21");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");

		// Descripción vacía
		PO_AddOfferView.fillForm(driver, "PruebaTitulo", "", "0.21");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");

		// Precio vacío
		PO_AddOfferView.fillForm(driver, "PruebaTitulo", "PruebaDescripcion", "");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");

		// Rellenamos el formulario de alta de oferta dejando todos los campos vacíos
		PO_AddOfferView.fillForm(driver, "", "", "");
		PO_View.checkElement(driver, "text", "No puede dejar campos vacíos");

		// Titulo demasiado corto
		PO_AddOfferView.fillForm(driver, "Pru", "PruebaDescripcion", "0.21");
		PO_View.checkElement(driver, "text",
				"El título debe de tener una longitud mínima de 5 carácteres y una longitud máxima de 20 carácteres");

		// Desctipción demasiado corta
		PO_AddOfferView.fillForm(driver, "PruebaTitulo", "Pru", "0.21");
		PO_View.checkElement(driver, "text",
				"La descripción debe de tener una longitud mínima de 5 carácteres y una longitud máxima de 50 carácteres");

		// Rellenamos el campo precio con una cadena
		PO_AddOfferView.fillForm(driver, "PruebaTitulo", "PruebaDescripcion", "prueba");
		PO_View.checkElement(driver, "text", "El precio debe de ser un número");

		// Introducimos un precio negativo
		PO_AddOfferView.fillForm(driver, "PruebaTitulo", "PruebaDescripcion", "-0.21");
		PO_View.checkElement(driver, "text", "El precio debe de ser un valor positivo");

		// Cerramos sesión y comprobamos que nos redirige a la página de login
		PO_NavView.logOut(driver);
	}

	// PR017. Mostrar el listado de ofertas para dicho usuario y comprobar que se
	// muestran todas las
	// que existen para este usuario. /
	@Test
	public void PR17() {
		// Iniciamos sesión como usuario estándar
		PO_NavView.logInAs(driver, "andrea@email.com", "123456");

		// Ir a la opcion de dar de alta una nota
		PO_NavView.displayOffersMenu(driver, "/standard/offer/myOffers");

		// Comprobamos que salen todas sus ofertas
		List<WebElement> elements = PO_View.checkElement(driver, "free", "//*[@id=\"tableOffers\"]/tbody/tr");
		assertTrue(elements.size() == 3);

		// Comprobamos títulos
		PO_View.checkElement(driver, "text", "Coche SEAT");
		PO_View.checkElement(driver, "text", "Pack material escolar");
		PO_View.checkElement(driver, "text", "Televisión 4K");

		// Comprobamos descripciones
		PO_View.checkElement(driver, "text", "Coche SEAT con 500 Km.");
		PO_View.checkElement(driver, "text", "Pack 5 rotuladores BIC.");
		PO_View.checkElement(driver, "text", "Para una buena tarde de Netflix.");

		// Comprobamos precios
		PO_View.checkElement(driver, "text", "1500");
		PO_View.checkElement(driver, "text", "2.2");
		PO_View.checkElement(driver, "text", "80.99");

		// Cerramos sesión y comprobamos que nos redirige a la página de login
		PO_NavView.logOut(driver);
	}

	// PR18. Ir a la lista de ofertas, borrar la primera oferta de la lista,
	// comprobar que la lista se actualiza y que la oferta desaparece. /
	@Test
	public void PR18() {
		// Iniciamos sesión como usuario estándar
		PO_NavView.logInAs(driver, "andrea@email.com", "123456");

		// Ir a la opcion de listar ofertas propias
		PO_NavView.displayOffersMenu(driver, "/standard/offer/myOffers");

		// Borramos la primera oferta
		List<WebElement> elements = PO_View.checkElement(driver, "free", "//*[@id=\"tableOffers\"]/tbody/tr/td[4]/a");
		assertTrue(elements.size() == 3);
		elements.get(0).click();

		// Comprobar que se ha eliminado correctamente
		elements = PO_View.checkElement(driver, "free", "//*[@id=\"tableOffers\"]/tbody/tr");
		assertTrue(elements.size() == 2);
		SeleniumUtils.textoNoPresentePagina(driver, "Coche SEAT");
		SeleniumUtils.textoNoPresentePagina(driver, "Coche SEAT con 500 Km.");

		// Hacemos logout
		PO_NavView.logOut(driver);
	}

	// PR19. Ir a la lista de ofertas, borrar la última oferta de la lista,
	// comprobar que la lista se actualiza
	// y que la oferta desaparece. /
	@Test
	public void PR19() {
		// Iniciamos sesión como usuario estándar
		PO_NavView.logInAs(driver, "andrea@email.com", "123456");

		// Ir a la opcion de listar ofertas propias
		PO_NavView.displayOffersMenu(driver, "/standard/offer/myOffers");

		// Borramos la última oferta
		List<WebElement> elements = PO_View.checkElement(driver, "free", "//*[@id=\"tableOffers\"]/tbody/tr/td[4]/a");
		assertTrue(elements.size() == 3);
		elements.get(2).click();

		// Comprobar que se ha eliminado correctamente
		elements = PO_View.checkElement(driver, "free", "//*[@id=\"tableOffers\"]/tbody/tr");
		assertTrue(elements.size() == 2);
		SeleniumUtils.textoNoPresentePagina(driver, "Pack material escolar");
		SeleniumUtils.textoNoPresentePagina(driver, "Pack 5 rotuladores BIC.");

		// Hacemos logout
		PO_NavView.logOut(driver);
	}

	// P20. Hacer una búsqueda con el campo vacío y comprobar que se muestra la
	// página que corresponde con el listado de las ofertas existentes en el sistema /
	@Test
	public void PR20() {
		// Iniciamos sesión como usuario estándar
		PO_NavView.logInAs(driver, "pepe@email.com", "123456");

		// Ir a la opcion de buscar ofertas
		PO_NavView.displayOffersMenu(driver, "/standard/offer/searchOffers");

		// Hacemos una búsqueda vacía 
		PO_SearchListView.makeSearch(driver, "");
		
		// Comprobar que se muestran todas las ofertas 
		List<WebElement> elements = PO_View.checkElement(driver, "free", "//*[@id=\"pages\"]/li/a");
		assertTrue(elements.size() == 2);
		
		// Primera página
		elements = PO_View.checkElement(driver, "free", "//*[@id=\"tableOffers\"]/tbody/tr");
		assertTrue(elements.size() == 5);
		PO_View.checkElement(driver, "text", "Micrófono");
		PO_View.checkElement(driver, "text", "Disco duro");
		PO_View.checkElement(driver, "text", "Película molona");
		PO_View.checkElement(driver, "text", "Ordenador fijo HP");
		PO_View.checkElement(driver, "text", "Ratón oficina");

		// Segunda página 
		PO_View.checkElement(driver, "free", "//*[@id=\"pi-2\"]/a").get(0).click();
		elements = PO_View.checkElement(driver, "free", "//*[@id=\"pages\"]/li/a");
		assertTrue(elements.size() == 2);
		elements = PO_View.checkElement(driver, "free", "//*[@id=\"tableOffers\"]/tbody/tr");
		assertTrue(elements.size() == 4);
		PO_View.checkElement(driver, "text", "Coche SEAT");
		PO_View.checkElement(driver, "text", "Televisión 4K");
		PO_View.checkElement(driver, "text", "Pack material escolar");
		PO_View.checkElement(driver, "text", "Libro informática");
		
		// Hacemos logout
		PO_NavView.logOut(driver);
	}

	// PR21. Hacer una búsqueda escribiendo en el campo un texto que no exista y comprobar que se 
	// muestra la página que corresponde, con la lista de ofertas vacía. /
	@Test
	public void PR21() {
		// Iniciamos sesión como usuario estándar
		PO_NavView.logInAs(driver, "pepe@email.com", "123456");

		// Ir a la opcion de buscar ofertas
		PO_NavView.displayOffersMenu(driver, "/standard/offer/searchOffers");

		// Hacemos una búsqueda vacía 
		PO_SearchListView.makeSearch(driver, "inexistente");
		
		// Comprobar que no se muestra ninguna oferta 
		List<WebElement> elements = driver.findElements(By.xpath("//*[@id=\"tableSearchedOffers\"]/tbody/tr"));
		assertTrue(elements.size() == 0);
		
		elements = driver.findElements(By.xpath("//*[@id=\"pages\"]/li/a"));
		assertTrue(elements.size() == 0);
		
		// Hacemos logout
		PO_NavView.logOut(driver);
	}

	// PR22. Hacer una búsqueda escribiendo en el campo un texto en minúscula o mayúscula y 
	// comprobar que se muestra la página que corresponde, con la lista de ofertas que contengan
	// dicho texto, independientemente que el título esté almacenado en minúsculas o mayúscula. /
	@Test
	public void PR22() {
		// Iniciamos sesión como usuario estándar
		PO_NavView.logInAs(driver, "moises@email.com", "123456");

		// Ir a la opcion de buscar ofertas
		PO_NavView.displayOffersMenu(driver, "/standard/offer/searchOffers");

		// Hacemos una búsqueda vacía 
		PO_SearchListView.makeSearch(driver, "coCh");
		
		// Comprobar que se muestran las 2 ofertas de coches
		List<WebElement> elements = PO_View.checkElement(driver, "free", "//*[@id=\"tableOffers\"]/tbody/tr");
		assertTrue(elements.size() == 2);
		PO_View.checkElement(driver, "text", "Coche SEAT");
		PO_View.checkElement(driver, "text", "coche BMW");
		
		// Hacemos logout
		PO_NavView.logOut(driver);
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
