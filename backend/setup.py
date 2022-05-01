import os
from setuptools import setup, find_packages

with open('README.md', 'r') as f:
    readme = f.read()


def get_package_data(directory):
    paths = []
    for (path, _, filenames) in os.walk(directory):
        for filename in filenames:
            paths.append(os.path.join('..', path, filename))
    return paths


setup_path = os.path.realpath(__file__)
dir_path = os.path.join(os.path.dirname(setup_path), "fennekservice")

setup(
    name="fennekservice",
    description="The Fennek AI backend service",
    long_description=readme,
    long_description_content_type='text/markdown',
    version="0.1",
    author="Clemens Biehl,Emrehan firtin",
    author_email="emrehanfirtin@gmail.com",
    url="www.fennek-ai.com",
    packages=find_packages(),
    package_data={'': get_package_data(dir_path)},
    include_package_data=True,
    python_requires=">=3.7.*",
    install_requires=['numpy', 'requests'],
    license="",
    zip_safe=False,
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'Programming Language :: Python :: 3.7',
    ],
    keywords='audio ml sound '
)
